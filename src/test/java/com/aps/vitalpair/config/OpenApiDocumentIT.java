package com.aps.vitalpair.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.aps.vitalpair.support.MailpitSupport;
import com.aps.vitalpair.support.TestcontainersConfiguration;
import com.aps.vitalpair.support.WireMockSupport;
import com.fasterxml.jackson.databind.JsonNode;

/**
 * The generated API document is complete enough to be useful.
 *
 * <p>Documentation rots the moment it is written by hand and checked by nobody. These
 * assertions are what keep the generated document honest: a controller added without a tag,
 * or an endpoint whose purpose is nowhere stated, fails the build rather than quietly
 * shipping a page of anonymous operations.
 *
 * <p>The document is disabled in production, so this runs in the default profile where it
 * is served.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Import(TestcontainersConfiguration.class)
@ActiveProfiles("test")
class OpenApiDocumentIT {

    @Autowired
    private TestRestTemplate http;

    @Autowired
    private ApplicationContext context;

    @DynamicPropertySource
    static void externalSystems(DynamicPropertyRegistry registry) {
        WireMockSupport.register(registry);
        MailpitSupport.register(registry);
    }

    private JsonNode document() {
        JsonNode body = http.getForObject("/v3/api-docs", JsonNode.class);
        assertThat(body).as("the API document should be served in this profile").isNotNull();
        return body;
    }

    @Test
    void theDocumentDescribesTheApiAndHowToAuthenticate() {
        JsonNode doc = document();

        assertThat(doc.path("info").path("title").asText()).isEqualTo("VitalPair API");
        // The envelope and the token flow are the two things a newcomer has to know before
        // any single endpoint makes sense.
        assertThat(doc.path("info").path("description").asText())
                .contains("success")
                .contains("requestId")
                .contains("Bearer");
        assertThat(doc.path("components")
                        .path("securitySchemes")
                        .path("bearerAuth")
                        .path("scheme")
                        .asText())
                .isEqualTo("bearer");
    }

    @Test
    void everyControllerAppearsAsItsOwnSection() {
        List<String> tags = new ArrayList<>();
        document().path("tags").forEach(tag -> tags.add(tag.path("name").asText()));

        // One tag per controller: without them the document is one long list of operations
        // with no indication of which feature each belongs to.
        long controllers = context.getBeansWithAnnotation(RestController.class).values().stream()
                .map(org.springframework.aop.support.AopUtils::getTargetClass)
                .filter(type -> type.getAnnotation(RequestMapping.class) != null)
                .count();

        assertThat(tags).as("every controller should contribute a section").hasSize((int) controllers);
        assertThat(tags).contains("Authentication", "Nutrition", "Meal plan", "Admin");
    }

    @Test
    void everyAuthenticationEndpointStatesWhatItDoes() {
        JsonNode paths = document().path("paths");

        List<String> undocumented = new ArrayList<>();
        paths.properties().forEach(entry -> {
            if (!entry.getKey().startsWith("/api/v1/auth/")) {
                return;
            }
            entry.getValue().properties().forEach(operation -> {
                String summary = operation.getValue().path("summary").asText("");
                if (summary.isBlank()) {
                    undocumented.add(operation.getKey().toUpperCase() + " " + entry.getKey());
                }
            });
        });

        // Authentication is where a newcomer starts and where the non-obvious rules live:
        // single-use refresh tokens, replay revoking a family, answers that deliberately
        // do not reveal whether an account exists.
        assertThat(undocumented).as("these endpoints have no summary").isEmpty();
    }

    @Test
    void theErrorEnvelopeIsPartOfTheContract() {
        JsonNode schemas = document().path("components").path("schemas");

        assertThat(schemas.has("ApiError"))
                .as("the error shape should be documented")
                .isTrue();
        JsonNode properties = schemas.path("ApiError").path("properties");
        assertThat(properties.has("requestId"))
                .as("the id a person quotes when reporting a failure")
                .isTrue();
        assertThat(properties.has("violations")).isTrue();
    }
}
