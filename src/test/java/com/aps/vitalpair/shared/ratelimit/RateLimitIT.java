package com.aps.vitalpair.shared.ratelimit;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;
import java.util.Set;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import com.aps.vitalpair.support.AbstractIntegrationTest;
import com.fasterxml.jackson.databind.JsonNode;

/**
 * The limiter as a caller sees it, through the real filter chain and the real Redis.
 *
 * <p>{@code RateLimiterTest} covers the counting; what only an integration test can show is
 * that the filter is registered once, runs after authentication so per-user policies see
 * the user, and answers in the standard envelope with the headers a client needs.
 */
class RateLimitIT extends AbstractIntegrationTest {

    private static final String LOGIN = "/api/v1/auth/login";
    private static final String GENERATE = "/api/v1/meal-plan/generate";

    @Test
    void theEleventhLoginAttemptFromOneAddressIsThrottledEvenWithTheRightPassword() {
        Session session = register("Rita");
        // Registering now ends with a sign-in, which spends one of the ten this test counts.
        clearRateLimitCounters();

        for (int attempt = 1; attempt <= 10; attempt++) {
            ResponseEntity<String> response =
                    anonymous(HttpMethod.POST, LOGIN, Map.of("email", session.email(), "password", "wrong-password"));
            assertThat(response.getStatusCode()).as("attempt %d", attempt).isEqualTo(HttpStatus.UNAUTHORIZED);
            assertThat(response.getHeaders().getFirst("X-RateLimit-Limit")).isEqualTo("10");
            assertThat(response.getHeaders().getFirst("X-RateLimit-Remaining")).isEqualTo(String.valueOf(10 - attempt));
        }

        ResponseEntity<String> eleventh =
                anonymous(HttpMethod.POST, LOGIN, Map.of("email", session.email(), "password", PASSWORD));

        assertThat(eleventh.getStatusCode()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS);
        assertThat(eleventh.getHeaders().getContentType().isCompatibleWith(MediaType.APPLICATION_JSON))
                .as("a client parsing the envelope must not receive a differently-typed body")
                .isTrue();
        String retryAfter = eleventh.getHeaders().getFirst(HttpHeaders.RETRY_AFTER);
        assertThat(retryAfter).matches("\\d+");
        assertThat(Integer.parseInt(retryAfter)).isBetween(1, 60);
        JsonNode body = body(eleventh);
        assertThat(body.path("success").asBoolean()).isFalse();
        assertThat(body.path("message").asText()).startsWith("Muitas tentativas. Tente de novo em ");
        assertThat(body.path("data").path("status").asInt()).isEqualTo(429);
        assertThat(body.path("data").path("path").asText()).isEqualTo(LOGIN);
    }

    @Test
    void planGenerationIsCappedPerUserNotPerAddress() {
        // Neither user has a profile, so every call stops at the 422 guard. The limiter
        // counts before that, which is the point: a caller cannot burn the budget for free.
        Session ana = register("Ana");
        Session beto = register("Beto");
        // Both past the paid-plan door, so the limiter is what answers and not the plan.
        grantPremium(ana);
        grantPremium(beto);

        for (int call = 1; call <= 5; call++) {
            ResponseEntity<String> response = httpPost(GENERATE, null, ana);
            assertThat(response.getStatusCode()).as("call %d", call).isEqualTo(HttpStatus.UNPROCESSABLE_ENTITY);
        }
        assertThat(httpPost(GENERATE, null, ana).getStatusCode()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS);

        assertThat(httpPost(GENERATE, null, beto).getStatusCode())
                .as("another user from the same address keeps their own allowance")
                .isEqualTo(HttpStatus.UNPROCESSABLE_ENTITY);
    }

    @Test
    void countersAreKeyedByPolicyAndCallerInRedis() {
        Session session = register("Sofia");
        // Registering ends with a sign-in, so the count starts at one before this test's own.
        clearRateLimitCounters();
        anonymous(HttpMethod.POST, LOGIN, Map.of("email", session.email(), "password", PASSWORD));

        Set<String> loginKeys = redis.keys("ratelimit:login:ip:*");
        assertThat(loginKeys).hasSize(1);
        String key = loginKeys.iterator().next();
        assertThat(redis.opsForValue().get(key)).isEqualTo("1");
        assertThat(redis.getExpire(key)).isBetween(1L, 60L);
    }

    @Test
    void unlimitedRoutesCarryNoRateLimitHeaders() {
        Session session = register("Tiago");

        ResponseEntity<String> response = httpGet("/api/v1/users/me", session);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getHeaders().containsKey("X-RateLimit-Limit")).isFalse();
    }
}
