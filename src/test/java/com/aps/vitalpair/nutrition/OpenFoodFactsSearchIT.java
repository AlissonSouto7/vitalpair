package com.aps.vitalpair.nutrition;

import static com.github.tomakehurst.wiremock.client.WireMock.aResponse;
import static com.github.tomakehurst.wiremock.client.WireMock.equalTo;
import static com.github.tomakehurst.wiremock.client.WireMock.get;
import static com.github.tomakehurst.wiremock.client.WireMock.getRequestedFor;
import static com.github.tomakehurst.wiremock.client.WireMock.matching;
import static com.github.tomakehurst.wiremock.client.WireMock.urlPathEqualTo;
import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import com.aps.vitalpair.support.AbstractIntegrationTest;
import com.aps.vitalpair.support.WireMockSupport;
import com.fasterxml.jackson.databind.JsonNode;
import com.github.tomakehurst.wiremock.http.Fault;

/**
 * Food lookup against a stubbed Open Food Facts, using responses captured from the real API.
 *
 * <p>Open Food Facts is a free service with no availability guarantee and highly uneven data:
 * plenty of products carry no nutriments at all. Both facts are load-bearing here. A search
 * must degrade to an empty list rather than an error page, and a product without calories
 * must not become a food log full of nulls that later breaks a daily total.
 */
class OpenFoodFactsSearchIT extends AbstractIntegrationTest {

    private static final String SEARCH_UPSTREAM = WireMockSupport.OFF_SEARCH_PREFIX + "/search";
    private static final String SEARCH = "/api/v1/nutrition/foods/search?q=banana";

    @Test
    void searchReturnsOnlyNamedProductsAndSendsTheRequiredUserAgent() {
        Session session = register("Ivo");
        WireMockSupport.server()
                .stubFor(get(urlPathEqualTo(SEARCH_UPSTREAM))
                        .willReturn(aResponse()
                                .withStatus(200)
                                .withHeader("Content-Type", "application/json")
                                .withBodyFile("openfoodfacts/search-banana.json")));

        ResponseEntity<String> response = httpGet(SEARCH, session);

        assertThat(response.getStatusCode()).as(response.getBody()).isEqualTo(HttpStatus.OK);
        JsonNode results = data(response);
        // The fixture holds three hits, all named. One carries nutriments, two do not.
        assertThat(results).hasSize(3);
        assertThat(results.valueStream().map(p -> p.path("name").asText()))
                .allSatisfy(name -> assertThat(name).isNotBlank());
        JsonNode withNutriments = results.valueStream()
                .filter(p -> !p.path("caloriesPer100g").isNull())
                .findFirst()
                .orElseThrow();
        assertThat(withNutriments.path("caloriesPer100g").asDouble()).isEqualTo(89.0);
        assertThat(withNutriments.path("proteinPer100g").asDouble()).isEqualTo(1.1);

        // Open Food Facts blocks callers without an identifying User-Agent.
        WireMockSupport.server()
                .verify(getRequestedFor(urlPathEqualTo(SEARCH_UPSTREAM))
                        .withQueryParam("q", equalTo("banana"))
                        .withQueryParam("page_size", equalTo("20"))
                        .withHeader("User-Agent", matching("VitalPair/.*")));
    }

    @Test
    void anUpstreamOutageBecomesAnEmptyListNotAnError() {
        Session session = register("Joana");
        WireMockSupport.server()
                .stubFor(get(urlPathEqualTo(SEARCH_UPSTREAM))
                        .willReturn(aResponse().withStatus(503)));

        ResponseEntity<String> response = httpGet(SEARCH, session);

        assertThat(response.getStatusCode())
                .as("a search box must not show an error page when a free API is down")
                .isEqualTo(HttpStatus.OK);
        assertThat(data(response)).isEmpty();
    }

    @Test
    void aStalledUpstreamGivesUpOnTheReadTimeout() {
        Session session = register("Kleber");
        // The adapter allows 5s for a read; the stub takes longer on purpose.
        WireMockSupport.server()
                .stubFor(get(urlPathEqualTo(SEARCH_UPSTREAM))
                        .willReturn(aResponse()
                                .withStatus(200)
                                .withFixedDelay(9000)
                                .withHeader("Content-Type", "application/json")
                                .withBody("{\"hits\":[]}")));

        long started = System.nanoTime();
        ResponseEntity<String> response = httpGet(SEARCH, session);
        long elapsedMs = (System.nanoTime() - started) / 1_000_000;

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(data(response)).isEmpty();
        assertThat(elapsedMs)
                .as("a stalled call must not hold the request thread for the full delay")
                .isLessThan(8000);
    }

    @Test
    void aDroppedConnectionAlsoDegradesToAnEmptyList() {
        Session session = register("Lia");
        WireMockSupport.server()
                .stubFor(get(urlPathEqualTo(SEARCH_UPSTREAM))
                        .willReturn(aResponse().withFault(Fault.CONNECTION_RESET_BY_PEER)));

        ResponseEntity<String> response = httpGet(SEARCH, session);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(data(response)).isEmpty();
    }

    @Test
    void aKnownBarcodeReturnsTheProduct() {
        Session session = register("Marco");
        WireMockSupport.server()
                .stubFor(get(urlPathEqualTo("/off/api/v2/product/7891000100103.json"))
                        .willReturn(aResponse()
                                .withStatus(200)
                                .withHeader("Content-Type", "application/json")
                                .withBodyFile("openfoodfacts/product-7891000100103.json")));

        ResponseEntity<String> response = httpGet("/api/v1/nutrition/foods/barcode/7891000100103", session);

        assertThat(response.getStatusCode()).as(response.getBody()).isEqualTo(HttpStatus.OK);
        JsonNode product = data(response);
        assertThat(product.path("name").asText()).isEqualTo("Leite Condensado Integral moça");
        assertThat(product.path("barcode").asText()).isEqualTo("7891000100103");
        assertThat(product.path("caloriesPer100g").asDouble()).isPositive();
    }

    @Test
    void anUnknownBarcodeIsA404() {
        Session session = register("Nadia");
        // status 0 is how Open Food Facts reports an unknown code, with HTTP 200.
        WireMockSupport.server()
                .stubFor(get(urlPathEqualTo("/off/api/v2/product/0000000000000.json"))
                        .willReturn(aResponse()
                                .withStatus(200)
                                .withHeader("Content-Type", "application/json")
                                .withBodyFile("openfoodfacts/product-unknown.json")));

        ResponseEntity<String> response = httpGet("/api/v1/nutrition/foods/barcode/0000000000000", session);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(body(response).path("message").asText())
                .isEqualTo("Produto não encontrado para o código 0000000000000");
    }

    @Test
    void searchRequiresAuthentication() {
        ResponseEntity<String> response = anonymous(org.springframework.http.HttpMethod.GET, SEARCH, null);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(WireMockSupport.server().getAllServeEvents())
                .as("an unauthenticated request must not reach the upstream API")
                .isEmpty();
    }

    @Test
    void aTooShortQueryIsRejectedWithoutReachingTheUpstream() {
        Session session = register("Otavio");

        // A single character, and the empty string, are not a search anyone means to run. They
        // were the free ride into the outbound call before the bound existed.
        ResponseEntity<String> single = httpGet("/api/v1/nutrition/foods/search?q=a", session);
        ResponseEntity<String> empty = httpGet("/api/v1/nutrition/foods/search?q=", session);

        assertThat(single.getStatusCode()).as(single.getBody()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(empty.getStatusCode()).as(empty.getBody()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(WireMockSupport.server().getAllServeEvents())
                .as("a query the server rejects must never spend an outbound call")
                .isEmpty();
    }

    @Test
    void searchIsCappedPerUser() {
        Session session = register("Paula");
        WireMockSupport.server()
                .stubFor(get(urlPathEqualTo(SEARCH_UPSTREAM))
                        .willReturn(aResponse()
                                .withStatus(200)
                                .withHeader("Content-Type", "application/json")
                                .withBody("{\"hits\":[]}")));

        // The limit is 60 a minute. The sixty-first from the same user is refused, so one account
        // cannot turn the search box into an unmetered proxy to Open Food Facts.
        HttpStatus last = null;
        for (int i = 1; i <= 61; i++) {
            last = HttpStatus.valueOf(httpGet(SEARCH, session).getStatusCode().value());
        }

        assertThat(last).as("the 61st search in a minute must be throttled").isEqualTo(HttpStatus.TOO_MANY_REQUESTS);
    }
}
