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
 * Boots the production profile with {@code SWAGGER_ENABLED=true}, which is how staging runs.
 *
 * <p>Staging and production share the profile; what differs is this one flag, set by the
 * staging env file, with the edge proxy putting basic auth in front of the pages it opens.
 * {@link SwaggerDisabledInProdIT} proves the flag is off by default. This proves the switch
 * actually opens the documentation, so a staging machine does not find out at deploy time
 * that it is still dark.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = "SWAGGER_ENABLED=true")
@Import(TestcontainersConfiguration.class)
@ActiveProfiles({"test", "prod"})
class SwaggerEnabledByFlagIT {

    @Autowired
    private TestRestTemplate http;

    @DynamicPropertySource
    static void externalSystems(DynamicPropertyRegistry registry) {
        WireMockSupport.register(registry);
        MailpitSupport.register(registry);
    }

    @Test
    void apiDocsAndSwaggerUiAreServedWhenTheFlagIsOn() {
        var docs = http.getForEntity("/v3/api-docs", String.class);
        assertThat(docs.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(docs.getBody()).contains("\"openapi\"");

        assertThat(http.getForEntity("/swagger-ui/index.html", String.class).getStatusCode())
                .isEqualTo(HttpStatus.OK);
    }
}
