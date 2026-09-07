package com.aps.vitalpair.config;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import com.aps.vitalpair.support.MailpitSupport;
import com.aps.vitalpair.support.TestcontainersConfiguration;
import com.aps.vitalpair.support.WireMockSupport;

/**
 * Boots the application with the production profile.
 *
 * <p>Nothing else in the suite parses {@code application-prod.yaml}, so a typo there used
 * to surface only at deploy time. Starting the context is the main assertion; the endpoint
 * checks confirm the two things that profile is responsible for: the API browser is gone
 * and health is still answering for the load balancer.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Import(TestcontainersConfiguration.class)
@ActiveProfiles({"test", "prod"})
class SwaggerDisabledInProdIT {

    @Autowired
    private TestRestTemplate http;

    @DynamicPropertySource
    static void externalSystems(DynamicPropertyRegistry registry) {
        WireMockSupport.register(registry);
        MailpitSupport.register(registry);
    }

    @Test
    void apiDocsAndSwaggerUiAreNotServed() {
        // These paths are permitted by SecurityConfig, so a 404 means the pages do not exist
        // rather than that the caller lacks a token.
        assertThat(http.getForEntity("/v3/api-docs", String.class).getStatusCode())
                .isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(http.getForEntity("/swagger-ui.html", String.class).getStatusCode())
                .isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(http.getForEntity("/swagger-ui/index.html", String.class).getStatusCode())
                .isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void healthStillAnswers() {
        var health = http.getForEntity("/actuator/health", String.class);

        assertThat(health.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(health.getBody()).contains("\"status\":\"UP\"");
    }
}
