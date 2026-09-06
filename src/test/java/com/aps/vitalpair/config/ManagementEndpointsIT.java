package com.aps.vitalpair.config;

import static com.github.tomakehurst.wiremock.client.WireMock.aResponse;
import static com.github.tomakehurst.wiremock.client.WireMock.post;
import static com.github.tomakehurst.wiremock.client.WireMock.urlPathEqualTo;
import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.autoconfigure.actuate.observability.AutoConfigureObservability;
import org.springframework.boot.test.web.server.LocalManagementPort;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestClient;

import com.aps.vitalpair.support.AbstractIntegrationTest;
import com.aps.vitalpair.support.WireMockSupport;
import com.aps.vitalpair.user.domain.model.Goal;

/**
 * Metrics and health live on a port of their own, and the application's own numbers are there.
 *
 * <p>Two separate risks. Serving metrics on the public port hands anyone who finds it a live
 * readout of the system; serving them nowhere means an outage is discovered by users. The
 * split port answers both, and this test is what keeps it true after a configuration edit.
 */
// Spring Boot replaces the metrics registry with a no-op one in tests, so that a test does
// not pay to collect metrics nobody reads. This class is precisely about the metrics, so it
// asks for the real registry back; without it the Prometheus endpoint does not even exist
// and the test passes or fails for reasons that have nothing to do with the configuration.
@AutoConfigureObservability
class ManagementEndpointsIT extends AbstractIntegrationTest {

    @LocalManagementPort
    private int managementPort;

    @Value("${local.server.port}")
    private int applicationPort;

    private RestClient management() {
        return RestClient.create("http://localhost:" + managementPort);
    }

    @Test
    void managementRunsOnItsOwnPort() {
        assertThat(managementPort).isNotEqualTo(applicationPort);
    }

    @Test
    void healthAndPrometheusAreServedOnTheManagementPort() {
        String health = management().get().uri("/actuator/health").retrieve().body(String.class);
        assertThat(health).contains("\"status\":\"UP\"");

        String metrics =
                management().get().uri("/actuator/prometheus").retrieve().body(String.class);
        assertThat(metrics).contains("jvm_memory_used_bytes");
        assertThat(metrics)
                .as("every metric is tagged with the application name")
                .contains("application=\"vitalpair\"");
    }

    @Test
    void theApplicationPortServesNoMetrics() {
        ResponseEntity<String> onPublicPort = anonymous(HttpMethod.GET, "/actuator/prometheus", null);

        assertThat(onPublicPort.getStatusCode())
                .as("a live readout of the system must not be on the public port")
                .isIn(HttpStatus.NOT_FOUND, HttpStatus.UNAUTHORIZED);
    }

    @Test
    void aiCallsAreCountedAndTimed() {
        Session session = register("Nara");
        completeProfile(session, Goal.GAIN_MUSCLE);
        WireMockSupport.server()
                .stubFor(post(urlPathEqualTo(WireMockSupport.ANTHROPIC_PREFIX + "/v1/messages"))
                        .willReturn(aResponse()
                                .withStatus(200)
                                .withHeader("Content-Type", "application/json")
                                .withBodyFile("anthropic/meal-week.json")));

        httpPost("/api/v1/meal-plan/generate", null, session);

        String metrics =
                management().get().uri("/actuator/prometheus").retrieve().body(String.class);
        assertThat(metrics)
                .as("a paid call that nobody counts is a bill nobody predicted")
                .contains("vitalpair_ai_requests_total")
                .contains("kind=\"meal-plan\"")
                .contains("outcome=\"success\"");
        assertThat(metrics).contains("vitalpair_ai_latency_seconds");
    }

    @Test
    void circuitBreakerStateIsPublished() {
        String metrics =
                management().get().uri("/actuator/prometheus").retrieve().body(String.class);

        assertThat(metrics).contains("resilience4j_circuitbreaker_state");
        assertThat(metrics).contains("name=\"anthropic\"");
        assertThat(metrics).contains("name=\"openfoodfacts\"");
    }
}
