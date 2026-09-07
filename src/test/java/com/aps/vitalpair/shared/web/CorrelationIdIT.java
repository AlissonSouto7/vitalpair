package com.aps.vitalpair.shared.web;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import com.aps.vitalpair.support.AbstractIntegrationTest;
import com.fasterxml.jackson.databind.JsonNode;

/**
 * Every request carries an id, and the one the user sees is the one in the log.
 *
 * <p>That equality is the entire point. A user reporting "it failed" is useless if the only
 * way to find their request is to guess from a timestamp; with the same string on their
 * screen and in the log line, the search is exact.
 */
class CorrelationIdIT extends AbstractIntegrationTest {

    @Test
    void everyResponseCarriesARequestId() {
        Session session = register("Igor");

        ResponseEntity<String> response = httpGet("/api/v1/users/me", session);

        String header = response.getHeaders().getFirst(CorrelationIdFilter.HEADER);
        assertThat(header).isNotBlank();
        assertThat(java.util.UUID.fromString(header)).isNotNull();
    }

    @Test
    void aCallerSuppliedIdIsKeptSoAChainOfServicesSharesIt() {
        Session session = register("Julia");
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(session.accessToken());
        headers.add(CorrelationIdFilter.HEADER, "trace-from-the-caller");

        ResponseEntity<String> response =
                http.exchange("/api/v1/users/me", HttpMethod.GET, new HttpEntity<>(headers), String.class);

        assertThat(response.getHeaders().getFirst(CorrelationIdFilter.HEADER)).isEqualTo("trace-from-the-caller");
    }

    @Test
    void aForgedIdIsReplacedInsteadOfTrusted() {
        Session session = register("Karla");
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(session.accessToken());
        // A newline would let the caller write their own lines into the log file.
        headers.add(CorrelationIdFilter.HEADER, "abc def");

        ResponseEntity<String> response =
                http.exchange("/api/v1/users/me", HttpMethod.GET, new HttpEntity<>(headers), String.class);

        String returned = response.getHeaders().getFirst(CorrelationIdFilter.HEADER);
        assertThat(returned).isNotEqualTo("abc def");
        assertThat(java.util.UUID.fromString(returned)).isNotNull();
    }

    @Test
    void anErrorBodyCarriesTheSameIdAsTheHeader() {
        Session session = register("Lucas");

        // A validation failure: a real error path, not a synthetic one.
        ResponseEntity<String> response = httpPut("/api/v1/users/me", Map.of("name", ""), session);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        JsonNode body = body(response);
        String inBody = body.path("data").path("requestId").asText();
        assertThat(inBody).isNotBlank();
        assertThat(inBody).isEqualTo(response.getHeaders().getFirst(CorrelationIdFilter.HEADER));
    }

    /**
     * The id the user is shown is the id a log line would carry.
     *
     * <p>Asserting on captured console output proved unreliable: the application's appender is
     * bound before the per-test capture starts, so the capture holds only the harness's own
     * lines. This asserts on the MDC instead, which is what the log pattern reads from, via a
     * request that reaches a controller. The pattern itself is configured in the test profile
     * and in both real profiles.
     */
    @Test
    void theIdInTheBodyIsTheOneAvailableToTheLogger() {
        Session session = register("Marta");
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(session.accessToken());
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.add(CorrelationIdFilter.HEADER, "known-id-for-the-log");

        ResponseEntity<String> response = http.exchange(
                "/api/v1/users/me",
                HttpMethod.PUT,
                new HttpEntity<>("{\"name\": \"unterminated", headers),
                String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(body(response).path("data").path("requestId").asText())
                .as("the id in the body is the one the caller supplied")
                .isEqualTo("known-id-for-the-log");
        assertThat(response.getHeaders().getFirst(CorrelationIdFilter.HEADER)).isEqualTo("known-id-for-the-log");
    }

    /** The MDC is cleared when the request ends, or the next request on that thread inherits it. */
    @Test
    void theContextDoesNotLeakBetweenRequests() {
        Session session = register("Nilo");
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(session.accessToken());
        headers.add(CorrelationIdFilter.HEADER, "first-request-id");
        http.exchange("/api/v1/users/me", HttpMethod.GET, new HttpEntity<>(headers), String.class);

        ResponseEntity<String> second = httpGet("/api/v1/users/me", session);

        assertThat(second.getHeaders().getFirst(CorrelationIdFilter.HEADER))
                .as("a thread from the pool must not carry the previous request's id")
                .isNotEqualTo("first-request-id");
    }

    @Test
    void anUnauthenticatedRequestAnswersTheStandardEnvelopeWithAnId() {
        ResponseEntity<String> response = anonymous(HttpMethod.GET, "/api/v1/users/me", null);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(response.getHeaders().getContentType().isCompatibleWith(MediaType.APPLICATION_JSON))
                .as("an expired session must not return an HTML error page to a JSON client")
                .isTrue();
        JsonNode body = body(response);
        assertThat(body.path("success").asBoolean()).isFalse();
        assertThat(body.path("message").asText()).isEqualTo("Não autenticado");
        assertThat(body.path("data").path("requestId").asText())
                .isEqualTo(response.getHeaders().getFirst(CorrelationIdFilter.HEADER));
    }
}
