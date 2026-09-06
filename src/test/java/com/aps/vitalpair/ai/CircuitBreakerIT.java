package com.aps.vitalpair.ai;

import static com.github.tomakehurst.wiremock.client.WireMock.aResponse;
import static com.github.tomakehurst.wiremock.client.WireMock.post;
import static com.github.tomakehurst.wiremock.client.WireMock.postRequestedFor;
import static com.github.tomakehurst.wiremock.client.WireMock.urlPathEqualTo;
import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import com.aps.vitalpair.support.AbstractIntegrationTest;
import com.aps.vitalpair.support.WireMockSupport;
import com.aps.vitalpair.user.domain.model.Goal;

import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;

/**
 * The breaker stops calling a partner that is failing.
 *
 * <p>Without it, every request keeps paying the full timeout while the partner is down: the
 * user waits a minute to be told it failed, and the request threads pile up waiting. Once
 * open, the answer is immediate and the load on a struggling partner drops to nothing.
 */
class CircuitBreakerIT extends AbstractIntegrationTest {

    private static final String MESSAGES = WireMockSupport.ANTHROPIC_PREFIX + "/v1/messages";

    @Autowired
    private CircuitBreakerRegistry registry;

    @BeforeEach
    void closeTheBreaker() {
        // The registry outlives a single test, so a breaker left open by a previous one would
        // decide this test's outcome before it starts.
        registry.getAllCircuitBreakers().forEach(CircuitBreaker::reset);
    }

    /**
     * Registers an account without the per-IP signup limit getting in the way.
     *
     * <p>These tests need six accounts to reach the breaker's window, and registration allows
     * five a minute from one address. Clearing the counter keeps the test about the breaker;
     * RateLimitIT is what proves the limit itself works.
     */
    private Session registerBeyondTheSignupLimit(String name) {
        java.util.Set<String> counters = redis.keys("ratelimit:register:*");
        if (counters != null && !counters.isEmpty()) {
            redis.delete(counters);
        }
        Session session = register(name);
        completeProfile(session, Goal.GAIN_MUSCLE);
        return session;
    }

    @Test
    void repeatedFailuresOpenTheBreakerAndFurtherCallsNeverReachTheApi() {
        WireMockSupport.server()
                .stubFor(post(urlPathEqualTo(MESSAGES))
                        .willReturn(aResponse()
                                .withStatus(500)
                                .withHeader("Content-Type", "application/json")
                                .withBody("{\"type\":\"error\"}")));

        // The breaker opens after five calls at a 50% failure rate. A different account per
        // call, because plan generation is capped at five an hour per user: reusing one would
        // hit the rate limiter first and the test would prove nothing about the breaker.
        for (int attempt = 1; attempt <= 5; attempt++) {
            Session caller = registerBeyondTheSignupLimit("Bruna" + attempt);
            ResponseEntity<String> response = httpPost("/api/v1/meal-plan/generate", null, caller);
            assertThat(response.getStatusCode()).as("attempt %d", attempt).isEqualTo(HttpStatus.BAD_GATEWAY);
        }
        Session session = registerBeyondTheSignupLimit("BrunaLast");

        CircuitBreaker breaker = registry.circuitBreaker("anthropic");
        assertThat(breaker.getState()).isEqualTo(CircuitBreaker.State.OPEN);

        WireMockSupport.server().resetRequests();
        ResponseEntity<String> refused = httpPost("/api/v1/meal-plan/generate", null, session);

        assertThat(refused.getStatusCode()).isEqualTo(HttpStatus.BAD_GATEWAY);
        assertThat(body(refused).path("message").asText())
                .isEqualTo("A geração por IA está indisponível no momento. Tente em alguns minutos.");
        WireMockSupport.server().verify(0, postRequestedFor(urlPathEqualTo(MESSAGES)));
    }

    @Test
    void aClosedBreakerLetsTheCallThrough() {
        Session session = register("Caio");
        completeProfile(session, Goal.GAIN_MUSCLE);
        WireMockSupport.server()
                .stubFor(post(urlPathEqualTo(MESSAGES))
                        .willReturn(aResponse()
                                .withStatus(200)
                                .withHeader("Content-Type", "application/json")
                                .withBodyFile("anthropic/meal-week.json")));

        ResponseEntity<String> response = httpPost("/api/v1/meal-plan/generate", null, session);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(registry.circuitBreaker("anthropic").getState()).isEqualTo(CircuitBreaker.State.CLOSED);
    }

    /**
     * A refusal by the model is not an outage.
     *
     * <p>It arrives as a normal 200 and means "I will not answer this", so it must not count
     * towards opening the breaker: otherwise a handful of odd prompts would take the feature
     * down for everyone.
     */
    @Test
    void aModelRefusalDoesNotOpenTheBreaker() {
        WireMockSupport.server()
                .stubFor(post(urlPathEqualTo(MESSAGES))
                        .willReturn(aResponse()
                                .withStatus(200)
                                .withHeader("Content-Type", "application/json")
                                .withBody("{\"content\":[],\"stop_reason\":\"refusal\"}")));

        for (int attempt = 1; attempt <= 5; attempt++) {
            Session caller = registerBeyondTheSignupLimit("Dora" + attempt);
            assertThat(httpPost("/api/v1/meal-plan/generate", null, caller).getStatusCode())
                    .isEqualTo(HttpStatus.BAD_GATEWAY);
        }

        assertThat(registry.circuitBreaker("anthropic").getState())
                .as("a refusal is an answer, not a failure of the partner")
                .isEqualTo(CircuitBreaker.State.CLOSED);
    }
}
