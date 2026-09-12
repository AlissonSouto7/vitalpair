package com.aps.vitalpair.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.file.Files;
import java.nio.file.Path;
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
    void everyEndpointStatesWhatItDoes() {
        JsonNode paths = document().path("paths");

        List<String> undocumented = new ArrayList<>();
        List<String> terse = new ArrayList<>();
        paths.properties().forEach(entry -> entry.getValue().properties().forEach(operation -> {
            String route = operation.getKey().toUpperCase() + " " + entry.getKey();
            String summary = operation.getValue().path("summary").asText("");
            String description = operation.getValue().path("description").asText("");
            if (summary.isBlank()) {
                undocumented.add(route);
            } else if (description.isBlank()) {
                terse.add(route);
            }
        }));

        // A summary names the operation; the description carries the rule a caller cannot
        // guess from the path: what is refused, what is limited, what a null means. An
        // endpoint with neither is one the reader has to open the code for, which is what
        // the document exists to spare them. Started with the auth endpoints in phase 13
        // and widened to all of them once every controller carried both.
        assertThat(undocumented).as("these endpoints have no summary").isEmpty();
        assertThat(terse)
                .as("these endpoints have a summary but no description")
                .isEmpty();
        assertThat(paths.size())
                .as("sanity: the document should list the real routes")
                .isGreaterThan(40);
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

    /**
     * Writes the document to {@code target/openapi.json}, which CI publishes as an artefact.
     *
     * <p>Here rather than in the workflow because the application is already running with a
     * real database behind it: generating it in CI would mean starting all of that a second
     * time to produce a file this test already has in hand. A reviewer can then download the
     * document for a pull request and diff it against the previous one, which is how an
     * accidental change to the public API gets noticed before somebody's client breaks.
     */
    @Test
    void theDocumentIsWrittenWhereCiCanPublishIt() throws Exception {
        Path target = Path.of("target", "openapi.json");
        Files.createDirectories(target.getParent());
        Files.writeString(target, document().toPrettyString());

        assertThat(target).exists();
        assertThat(Files.readString(target)).contains("VitalPair API");
    }
}
