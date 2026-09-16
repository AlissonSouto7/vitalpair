package com.aps.vitalpair.user;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import com.aps.vitalpair.support.AbstractIntegrationTest;
import com.fasterxml.jackson.databind.JsonNode;

/**
 * Updating a profile, and what a client is allowed to put in it.
 *
 * <p>Two things are being protected here. The targets are the server's to compute, so no
 * request may set them; and the avatar address is rendered inside the partner's browser, so
 * it decides where somebody else's browser makes a request.
 */
class ProfileUpdateIT extends AbstractIntegrationTest {

    private static Map<String, Object> validProfile() {
        Map<String, Object> body = new HashMap<>();
        body.put("name", "Alisson");
        body.put("birthDate", "1995-04-10");
        body.put("sex", "MALE");
        body.put("heightCm", 178);
        body.put("weightKg", 75);
        body.put("goal", "GAIN_MUSCLE");
        body.put("activityLevel", "MODERATE");
        return body;
    }

    @Test
    void updatingTheProfileRecomputesTheTargetsFromTheNewNumbers() {
        Session user = register("Alisson");

        ResponseEntity<String> response = httpPut("/api/v1/users/me", validProfile(), user);
        assertThat(response.getStatusCode())
                .as("update: %s", response.getBody())
                .isEqualTo(HttpStatus.OK);

        JsonNode profile = data(response);
        assertThat(profile.path("dailyCalorieTarget").asInt())
                .as("a bulking 75kg profile should get a target above maintenance")
                .isGreaterThan(2000);
        assertThat(profile.path("proteinTargetG").asInt()).isGreaterThan(0);
        assertThat(profile.path("passwordHash").isMissingNode())
                .as("the hash must never be in a response")
                .isTrue();
    }

    /**
     * The targets are derived from height, weight, age, sex, activity and goal. A client that
     * could send them directly would be choosing its own calorie budget, which makes the
     * whole tdee feature decorative.
     */
    @Test
    void aClientCannotChooseItsOwnCalorieTarget() {
        Session user = register("Alisson");

        Map<String, Object> body = validProfile();
        body.put("dailyCalorieTarget", 9000);
        body.put("proteinTargetG", 900);
        body.put("role", "ADMIN");

        ResponseEntity<String> response = httpPut("/api/v1/users/me", body, user);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);

        JsonNode profile = data(response);
        assertThat(profile.path("dailyCalorieTarget").asInt())
                .as("the server computes this, whatever the request said")
                .isNotEqualTo(9000);
        assertThat(profile.path("proteinTargetG").asInt()).isNotEqualTo(900);
        assertThat(response.getBody()).as("role is not part of this contract").doesNotContain("ADMIN");
    }

    /**
     * The only address this endpoint takes is the object name the upload produced.
     *
     * It used to accept any https URL, and this test asserted that. One person's avatar is
     * rendered in the other's browser, so an external address is a tracker handing whoever
     * chose it the partner's IP, user agent and the time they opened the app, on every
     * visit. The photo goes through POST /users/me/avatar now, and this field only carries
     * what came back from it.
     */
    @Test
    void theNameOfAnUploadedPhotoIsAccepted() {
        Session user = register("Alisson");

        String objectName = "9f8c2a1b4e6d7f30a5b9c8d7e6f50413.jpg";
        Map<String, Object> body = validProfile();
        body.put("avatarUrl", objectName);

        ResponseEntity<String> response = httpPut("/api/v1/users/me", body, user);
        assertThat(response.getStatusCode())
                .as("update: %s", response.getBody())
                .isEqualTo(HttpStatus.OK);
        assertThat(data(response).path("avatarUrl").asText()).isEqualTo(objectName);
    }

    @Test
    void clearingThePhotoIsAllowed() {
        // The empty string is how someone removes their photo; refusing it would leave the
        // old one with no way to take it down.
        Session user = register("Alisson");

        Map<String, Object> body = validProfile();
        body.put("avatarUrl", "");

        ResponseEntity<String> response = httpPut("/api/v1/users/me", body, user);
        assertThat(response.getStatusCode())
                .as("update: %s", response.getBody())
                .isEqualTo(HttpStatus.OK);
    }

    /**
     * Anything that is not an uploaded object name is refused, https included.
     *
     * The avatar is rendered in the partner's browser, so whoever sets it picks an address
     * that browser will fetch. https was the wrong axis: the problem is third-party origin,
     * not transport, so a well-formed https URL is on this list too.
     */
    @ParameterizedTest
    @ValueSource(
            strings = {
                "https://cdn.example.com/avatars/alisson.png",
                "http://tracker.example.com/beacon.png",
                "javascript:alert(1)",
                "data:image/svg+xml;base64,PHN2Zy8+",
                "//evil.example.com/x.png",
                "https://evil.example.com/x.png\" onerror=\"alert(1)",
                "../../etc/passwd",
                "9f8c2a1b4e6d7f30a5b9c8d7e6f50413.png"
            })
    void anAvatarThatIsNotAnUploadedNameIsRejected(String avatarUrl) {
        Session user = register("Alisson");

        Map<String, Object> body = validProfile();
        body.put("avatarUrl", avatarUrl);

        ResponseEntity<String> response = httpPut("/api/v1/users/me", body, user);
        assertThat(response.getStatusCode())
                .as("should have been refused: %s", avatarUrl)
                .isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(body(response).path("data").path("violations").toString()).contains("avatarUrl");
    }

    @Test
    void anImpossibleWeightIsRejected() {
        Session user = register("Alisson");

        Map<String, Object> body = validProfile();
        body.put("weightKg", 900);

        ResponseEntity<String> response = httpPut("/api/v1/users/me", body, user);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void aBirthDateInTheFutureIsRejected() {
        Session user = register("Alisson");

        Map<String, Object> body = validProfile();
        body.put("birthDate", "2999-01-01");

        ResponseEntity<String> response = httpPut("/api/v1/users/me", body, user);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void theProfileEndpointsRequireAuthentication() {
        assertThat(anonymous(org.springframework.http.HttpMethod.GET, "/api/v1/users/me", null)
                        .getStatusCode())
                .isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(anonymous(org.springframework.http.HttpMethod.PUT, "/api/v1/users/me", validProfile())
                        .getStatusCode())
                .isEqualTo(HttpStatus.UNAUTHORIZED);
    }
}
