package com.aps.vitalpair.mealvision;

import static com.github.tomakehurst.wiremock.client.WireMock.aResponse;
import static com.github.tomakehurst.wiremock.client.WireMock.equalTo;
import static com.github.tomakehurst.wiremock.client.WireMock.matchingJsonPath;
import static com.github.tomakehurst.wiremock.client.WireMock.post;
import static com.github.tomakehurst.wiremock.client.WireMock.postRequestedFor;
import static com.github.tomakehurst.wiremock.client.WireMock.urlPathEqualTo;
import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import com.aps.vitalpair.mealvision.infrastructure.web.PhotoAnalysisRequest;
import com.aps.vitalpair.support.AbstractIntegrationTest;
import com.aps.vitalpair.support.WireMockSupport;
import com.fasterxml.jackson.databind.JsonNode;

/**
 * Analysing a photo of a plate.
 *
 * <p>The endpoint had no test of any kind until phase 13, which mattered more than the count
 * suggests: it is one of the two paid paths, it takes an unbounded body from the client, and
 * it goes out through a Feign proxy of the same shape that once failed at runtime with an
 * {@code IllegalAccessError} the unit tests could not see.
 *
 * <p>The fixture is a real Anthropic response, captured on 2026-09-06 by sending a picture of
 * a plate to the live API with the same prompt and schema the adapter sends.
 */
class MealPhotoAnalysisIT extends AbstractIntegrationTest {

    private static final String PHOTO_PATH = WireMockSupport.ANTHROPIC_PREFIX + "/v1/messages";

    /** Any short base64 string: WireMock answers from a fixture, so the bytes are never decoded. */
    private static final String TINY_IMAGE = "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAA==";

    @Test
    void analysingAPhotoReturnsTheFoodsTheModelIdentified() {
        Session user = register("Photographer");
        WireMockSupport.server()
                .stubFor(post(urlPathEqualTo(PHOTO_PATH))
                        .willReturn(aResponse()
                                .withStatus(200)
                                .withHeader("Content-Type", "application/json")
                                .withBodyFile("anthropic/meal-photo.json")));

        ResponseEntity<String> response =
                httpPost("/api/v1/nutrition/photo", Map.of("imageBase64", TINY_IMAGE, "mediaType", "image/jpeg"), user);

        assertThat(response.getStatusCode())
                .as("analyse: %s", response.getBody())
                .isEqualTo(HttpStatus.OK);

        JsonNode items = data(response).path("items");
        assertThat(items).hasSize(3);
        assertThat(items.get(0).path("foodName").asText()).isEqualTo("Arroz branco");
        assertThat(items.get(0).path("quantityG").asInt()).isEqualTo(150);
        assertThat(items.get(0).path("caloriesKcal").asInt()).isEqualTo(195);

        // The image must reach the API as an image block, not as text, and the schema must be
        // requested: without it the model answers in prose and the parse fails.
        WireMockSupport.server()
                .verify(postRequestedFor(urlPathEqualTo(PHOTO_PATH))
                        .withHeader("anthropic-version", equalTo("2023-06-01"))
                        .withRequestBody(matchingJsonPath("$.messages[0].content[0].type", equalTo("image")))
                        .withRequestBody(
                                matchingJsonPath("$.messages[0].content[0].source.media_type", equalTo("image/jpeg")))
                        .withRequestBody(matchingJsonPath("$.output_config.format.type", equalTo("json_schema"))));
    }

    /**
     * The size limit exists because this endpoint spends money: the image becomes input
     * tokens on a paid call, so without a cap the cost of one request is chosen by whoever
     * sends it. The rejection has to happen before the call, not after.
     */
    @Test
    void anOversizedPhotoIsRejectedWithoutSpendingAnything() {
        Session user = register("Photographer");
        String tooBig = "A".repeat(PhotoAnalysisRequest.MAX_BASE64_LENGTH + 1);

        ResponseEntity<String> response =
                httpPost("/api/v1/nutrition/photo", Map.of("imageBase64", tooBig, "mediaType", "image/jpeg"), user);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(body(response).path("data").path("violations").toString()).contains("grande demais");
        assertThat(WireMockSupport.server().getAllServeEvents())
                .as("nothing should have been sent to the paid API")
                .isEmpty();
    }

    @Test
    void anImageJustUnderTheLimitIsAccepted() {
        Session user = register("Photographer");
        WireMockSupport.server()
                .stubFor(post(urlPathEqualTo(PHOTO_PATH))
                        .willReturn(aResponse()
                                .withStatus(200)
                                .withHeader("Content-Type", "application/json")
                                .withBodyFile("anthropic/meal-photo.json")));

        String atTheLimit = "A".repeat(PhotoAnalysisRequest.MAX_BASE64_LENGTH);
        ResponseEntity<String> response =
                httpPost("/api/v1/nutrition/photo", Map.of("imageBase64", atTheLimit, "mediaType", "image/jpeg"), user);

        assertThat(response.getStatusCode())
                .as("the boundary itself must pass, or the limit is off by one: %s", response.getBody())
                .isEqualTo(HttpStatus.OK);
    }

    @Test
    void anUnsupportedImageTypeIsRejectedWithoutSpendingAnything() {
        Session user = register("Photographer");

        ResponseEntity<String> response =
                httpPost("/api/v1/nutrition/photo", Map.of("imageBase64", TINY_IMAGE, "mediaType", "image/gif"), user);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(WireMockSupport.server().getAllServeEvents()).isEmpty();
    }

    /** A model that will not answer is not an outage, and the message has to say so. */
    @Test
    void aRefusalBecomesA502WithItsOwnMessage() {
        Session user = register("Photographer");
        WireMockSupport.server()
                .stubFor(post(urlPathEqualTo(PHOTO_PATH))
                        .willReturn(aResponse()
                                .withStatus(200)
                                .withHeader("Content-Type", "application/json")
                                .withBody("{\"content\":[],\"stop_reason\":\"refusal\"}")));

        ResponseEntity<String> response =
                httpPost("/api/v1/nutrition/photo", Map.of("imageBase64", TINY_IMAGE, "mediaType", "image/jpeg"), user);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_GATEWAY);
        assertThat(body(response).path("message").asText()).contains("não conseguiu analisar esta foto");
    }

    @Test
    void anOverloadedApiBecomesA502NotA500() {
        Session user = register("Photographer");
        WireMockSupport.server()
                .stubFor(post(urlPathEqualTo(PHOTO_PATH)).willReturn(aResponse().withStatus(529)));

        ResponseEntity<String> response =
                httpPost("/api/v1/nutrition/photo", Map.of("imageBase64", TINY_IMAGE, "mediaType", "image/jpeg"), user);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_GATEWAY);
        assertThat(body(response).path("message").asText()).contains("Não foi possível analisar a foto");
    }

    @Test
    void aPlateWithNoFoodIsAnEmptyListNotAnError() {
        Session user = register("Photographer");
        WireMockSupport.server()
                .stubFor(
                        post(urlPathEqualTo(PHOTO_PATH))
                                .willReturn(
                                        aResponse()
                                                .withStatus(200)
                                                .withHeader("Content-Type", "application/json")
                                                .withBody(
                                                        "{\"content\":[{\"type\":\"text\",\"text\":\"{\\\"items\\\":[]}\"}],\"stop_reason\":\"end_turn\"}")));

        ResponseEntity<String> response =
                httpPost("/api/v1/nutrition/photo", Map.of("imageBase64", TINY_IMAGE, "mediaType", "image/jpeg"), user);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(data(response).path("items")).isEmpty();
    }

    @Test
    void photoAnalysisRequiresAuthentication() {
        ResponseEntity<String> response = anonymous(
                HttpMethod.POST,
                "/api/v1/nutrition/photo",
                Map.of("imageBase64", TINY_IMAGE, "mediaType", "image/jpeg"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(WireMockSupport.server().getAllServeEvents()).isEmpty();
    }
}
