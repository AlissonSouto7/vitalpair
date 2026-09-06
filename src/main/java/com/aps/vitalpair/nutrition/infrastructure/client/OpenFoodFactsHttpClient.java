package com.aps.vitalpair.nutrition.infrastructure.client;

import java.time.Duration;

import org.springframework.boot.http.client.ClientHttpRequestFactoryBuilder;
import org.springframework.boot.http.client.ClientHttpRequestFactorySettings;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import com.aps.vitalpair.config.OpenFoodFactsProperties;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;

/**
 * The raw HTTP calls to Open Food Facts, with retry and a circuit breaker around them.
 *
 * <p>A separate bean on purpose. Resilience4j works through Spring proxies, and a proxy is
 * only involved when one bean calls another: had these methods stayed in the adapter and been
 * called from a sibling method, the annotations would have compiled, read correctly, and done
 * absolutely nothing. That failure is silent, which is the worst kind.
 *
 * <p>Retry is right for this API and wrong for Anthropic: this one is free, answers in
 * milliseconds and fails intermittently, while a repeated plan generation costs money twice
 * and takes another minute.
 */
@Component
public class OpenFoodFactsHttpClient {

    /**
     * Open Food Facts is a free public service with no availability guarantee. Without
     * timeouts a stalled call holds its request thread until the socket eventually gives up,
     * which under load exhausts the pool and takes down endpoints that never touch this API.
     *
     * <p>The values are deliberately short: this call sits between a user and a search box,
     * so failing fast and showing no results beats a page that hangs.
     */
    private static final Duration CONNECT_TIMEOUT = Duration.ofSeconds(3);

    private static final Duration READ_TIMEOUT = Duration.ofSeconds(5);

    private static final int SEARCH_PAGE_SIZE = 20;
    private static final String FIELDS = "code,product_name,nutriments";

    private final RestClient productClient;
    private final RestClient searchClient;

    public OpenFoodFactsHttpClient(OpenFoodFactsProperties properties) {
        this.productClient = client(properties.baseUrl(), properties.userAgent());
        this.searchClient = client(properties.searchUrl(), properties.userAgent());
    }

    private static RestClient client(String baseUrl, String userAgent) {
        ClientHttpRequestFactorySettings settings = ClientHttpRequestFactorySettings.defaults()
                .withConnectTimeout(CONNECT_TIMEOUT)
                .withReadTimeout(READ_TIMEOUT);
        return RestClient.builder()
                .baseUrl(baseUrl)
                .defaultHeader(HttpHeaders.USER_AGENT, userAgent)
                .requestFactory(ClientHttpRequestFactoryBuilder.jdk().build(settings))
                .build();
    }

    @Retry(name = "openfoodfacts")
    @CircuitBreaker(name = "openfoodfacts")
    public OffResponses.SearchResponse search(String query) {
        return searchClient
                .get()
                .uri(builder -> builder.path("/search")
                        .queryParam("q", query)
                        .queryParam("page_size", SEARCH_PAGE_SIZE)
                        .queryParam("fields", FIELDS)
                        .build())
                .retrieve()
                .body(OffResponses.SearchResponse.class);
    }

    @Retry(name = "openfoodfacts")
    @CircuitBreaker(name = "openfoodfacts")
    public OffResponses.ProductResponse product(String barcode) {
        return productClient
                .get()
                .uri(builder -> builder.path("/api/v2/product/{barcode}.json")
                        .queryParam("fields", FIELDS)
                        .build(barcode))
                .retrieve()
                .body(OffResponses.ProductResponse.class);
    }
}
