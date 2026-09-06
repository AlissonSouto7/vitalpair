package com.aps.vitalpair.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import com.aps.vitalpair.support.MailpitSupport;
import com.aps.vitalpair.support.TestcontainersConfiguration;
import com.aps.vitalpair.support.WireMockSupport;

/**
 * Boots the application with the development profile.
 *
 * <p>The profile every developer runs was the one profile no test loaded, and a duplicated
 * {@code server:} key in it went unnoticed until the application refused to start. Loading
 * it here turns that into a failing build. The endpoint checks pin what development relies
 * on: the API browser is available, and the refresh cookie is not marked Secure, because
 * without TLS a Secure cookie is never sent and every session would silently break.
 */
@SpringBootTest(
        webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties = {"logging.level.com.aps.vitalpair=INFO", "logging.level.org.hibernate.SQL=WARN"})
@Import(TestcontainersConfiguration.class)
@ActiveProfiles({"test", "dev"})
class DevProfileIT {

    @Autowired
    private TestRestTemplate http;

    @DynamicPropertySource
    static void externalSystems(DynamicPropertyRegistry registry) {
        WireMockSupport.register(registry);
        MailpitSupport.register(registry);
    }

    @Test
    void apiDocsAndSwaggerUiAreServed() {
        ResponseEntity<String> docs = http.getForEntity("/v3/api-docs", String.class);
        assertThat(docs.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(docs.getBody()).contains("/api/v1/auth/login");

        assertThat(http.getForEntity("/swagger-ui/index.html", String.class).getStatusCode())
                .isEqualTo(HttpStatus.OK);
    }

    @Test
    void refreshCookieIsNotSecureSoItWorksOverPlainHttp() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        String email = "dev-" + UUID.randomUUID().toString().substring(0, 8) + "@test.vitalpair.app";
        Map<String, String> body = Map.of("name", "Dev", "email", email, "password", "Test@12345");

        ResponseEntity<String> response =
                http.postForEntity("/api/v1/auth/register", new HttpEntity<>(body, headers), String.class);

        assertThat(response.getStatusCode()).as(response.getBody()).isEqualTo(HttpStatus.CREATED);
        List<String> cookies = response.getHeaders().getOrEmpty(HttpHeaders.SET_COOKIE);
        assertThat(cookies).anySatisfy(cookie -> assertThat(cookie)
                .startsWith("vp_refresh=")
                .contains("HttpOnly")
                .doesNotContain("Secure"));
    }
}
