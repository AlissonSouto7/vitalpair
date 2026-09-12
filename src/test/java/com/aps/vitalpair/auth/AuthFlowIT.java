package com.aps.vitalpair.auth;

import static org.assertj.core.api.Assertions.assertThat;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import com.aps.vitalpair.support.AbstractIntegrationTest;
import com.aps.vitalpair.support.MailpitSupport;
import com.aps.vitalpair.support.MailpitSupport.Mail;
import com.fasterxml.jackson.databind.JsonNode;

/**
 * The account lifecycle as a browser experiences it: register, receive the e-mail, confirm,
 * renew the session from the cookie, log out, recover a password.
 *
 * <p>Everything here crosses the real HTTP stack, the real Redis and a real SMTP server. The
 * unit tests in {@code AuthServiceTest} already cover the rotation and replay logic with
 * mocks; this class proves the wiring around it, which is where the cookie rework introduced the
 * cookie and where a mistake would let a browser session silently stop working.
 */
class AuthFlowIT extends AbstractIntegrationTest {

    private static final String REGISTER = "/api/v1/auth/register";
    private static final String LOGIN = "/api/v1/auth/login";
    private static final String REFRESH = "/api/v1/auth/refresh";
    private static final String LOGOUT = "/api/v1/auth/logout";

    @Test
    void registrationIssuesNoSessionAtAll() {
        String email = uniqueEmail("Ana");

        ResponseEntity<String> response =
                anonymous(HttpMethod.POST, REGISTER, Map.of("name", "Ana", "email", email, "password", PASSWORD));

        // Registration answers the same thing for a new address and for one that already has
        // an account, so it can carry neither a session nor a cookie: either would tell the
        // two apart. Signing in comes after the link in the e-mail is used.
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.ACCEPTED);
        assertThat(data(response).isNull()).isTrue();
        assertThat(response.getHeaders().get(HttpHeaders.SET_COOKIE)).isNull();
    }

    @Test
    void signingInSetsTheRefreshCookieAndKeepsTheTokenOutOfTheBody() {
        Session registered = register("Ana");

        ResponseEntity<String> response =
                anonymous(HttpMethod.POST, LOGIN, Map.of("email", registered.email(), "password", PASSWORD));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode data = data(response);
        assertThat(data.path("accessToken").asText()).isNotBlank();
        assertThat(data.path("userId").asText()).isNotBlank();
        assertThat(data.has("refreshToken"))
                .as("the refresh token must never be readable by page script")
                .isFalse();

        String cookie = setCookie(response);
        assertThat(cookie)
                .startsWith("vp_refresh=")
                .contains("HttpOnly")
                .contains("Secure")
                .contains("SameSite=Strict")
                .contains("Path=/api/v1/auth")
                .contains("Max-Age=2592000");

        Session session = sessionFrom(response, registered.email(), "Ana");
        ResponseEntity<String> me = httpGet("/api/v1/users/me", session);
        assertThat(me.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(data(me).path("email").asText()).isEqualTo(registered.email());
    }

    @Test
    void verificationEmailIsDeliveredAndItsLinkConfirmsTheAccount() {
        // Registers without the helper, which activates the account as part of its job: this
        // test is about the link itself, from the unconfirmed state to the confirmed one.
        String email = uniqueEmail("Bruno");
        assertThat(anonymous(HttpMethod.POST, REGISTER, Map.of("name", "Bruno", "email", email, "password", PASSWORD))
                        .getStatusCode())
                .isEqualTo(HttpStatus.ACCEPTED);

        // An unconfirmed address cannot sign in, which is what makes the link load-bearing.
        assertThat(anonymous(HttpMethod.POST, LOGIN, Map.of("email", email, "password", PASSWORD))
                        .getStatusCode())
                .isEqualTo(HttpStatus.FORBIDDEN);

        Mail mail = MailpitSupport.latestTo(email).orElseThrow();
        assertThat(mail.subject()).isEqualTo("Confirme seu e-mail no VitalPair");
        assertThat(mail.link()).contains("/verify-email?token=");
        assertThat(mail.html()).contains("Oi, Bruno!");

        String token = URLDecoder.decode(mail.token(), StandardCharsets.UTF_8);
        ResponseEntity<String> verify = anonymous(HttpMethod.POST, "/api/v1/auth/verify-email", Map.of("token", token));
        assertThat(verify.getStatusCode()).as(verify.getBody()).isEqualTo(HttpStatus.OK);

        Session session = login(email, PASSWORD);
        assertThat(data(httpGet("/api/v1/users/me", session))
                        .path("emailVerified")
                        .asBoolean())
                .isTrue();

        ResponseEntity<String> reuse = anonymous(HttpMethod.POST, "/api/v1/auth/verify-email", Map.of("token", token));
        assertThat(reuse.getStatusCode())
                .as("a verification token is single-use")
                .isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void refreshRotatesTheCookieAndAReplayRevokesTheWholeFamily() {
        Session session = register("Carla");

        ResponseEntity<String> first = withRefreshCookie(HttpMethod.POST, REFRESH, session.refreshToken());
        assertThat(first.getStatusCode()).as(first.getBody()).isEqualTo(HttpStatus.OK);
        assertThat(data(first).path("accessToken").asText()).isNotBlank();
        String rotated = refreshTokenFrom(first);
        assertThat(rotated).isNotNull().isNotEqualTo(session.refreshToken());

        ResponseEntity<String> replay = withRefreshCookie(HttpMethod.POST, REFRESH, session.refreshToken());
        assertThat(replay.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(body(replay).path("success").asBoolean()).isFalse();

        ResponseEntity<String> legitimate = withRefreshCookie(HttpMethod.POST, REFRESH, rotated);
        assertThat(legitimate.getStatusCode())
                .as("after a replay the still-valid token must die with the family")
                .isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void logoutRevokesTheSessionAndClearsTheCookie() {
        Session session = register("Diego");

        ResponseEntity<String> logout = withRefreshCookie(HttpMethod.POST, LOGOUT, session.refreshToken());
        assertThat(logout.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(setCookie(logout)).startsWith("vp_refresh=;").contains("Max-Age=0");

        ResponseEntity<String> refresh = withRefreshCookie(HttpMethod.POST, REFRESH, session.refreshToken());
        assertThat(refresh.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void refreshWithoutACookieIsUnauthorized() {
        ResponseEntity<String> response = withRefreshCookie(HttpMethod.POST, REFRESH, null);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(body(response).path("message").asText()).isEqualTo("Sessão expirada. Faça login novamente.");
    }

    @Test
    void logoutWithoutACookieStillSucceeds() {
        ResponseEntity<String> response = withRefreshCookie(HttpMethod.POST, LOGOUT, null);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void passwordResetEmailLetsTheUserChooseANewPassword() {
        Session session = register("Elisa");
        String newPassword = "Nova@Senha123";

        ResponseEntity<String> forgot =
                anonymous(HttpMethod.POST, "/api/v1/auth/forgot-password", Map.of("email", session.email()));
        assertThat(forgot.getStatusCode()).isEqualTo(HttpStatus.OK);

        Mail mail = MailpitSupport.latestTo(session.email()).orElseThrow();
        assertThat(mail.subject()).isEqualTo("Redefinição de senha do VitalPair");
        assertThat(mail.link()).contains("/reset-password?token=");
        String token = URLDecoder.decode(mail.token(), StandardCharsets.UTF_8);

        ResponseEntity<String> reset = anonymous(
                HttpMethod.POST, "/api/v1/auth/reset-password", Map.of("token", token, "newPassword", newPassword));
        assertThat(reset.getStatusCode()).as(reset.getBody()).isEqualTo(HttpStatus.OK);

        ResponseEntity<String> oldPassword =
                anonymous(HttpMethod.POST, LOGIN, Map.of("email", session.email(), "password", PASSWORD));
        assertThat(oldPassword.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        login(session.email(), newPassword);

        ResponseEntity<String> reuse = anonymous(
                HttpMethod.POST, "/api/v1/auth/reset-password", Map.of("token", token, "newPassword", "Outra@Senha1"));
        assertThat(reuse.getStatusCode()).as("a reset token is single-use").isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void forgotPasswordDoesNotRevealWhetherAnAccountExists() {
        Session known = register("Fabio");
        String unknown = uniqueEmail("nobody");

        ResponseEntity<String> forKnown =
                anonymous(HttpMethod.POST, "/api/v1/auth/forgot-password", Map.of("email", known.email()));
        ResponseEntity<String> forUnknown =
                anonymous(HttpMethod.POST, "/api/v1/auth/forgot-password", Map.of("email", unknown));

        assertThat(forUnknown.getStatusCode())
                .isEqualTo(forKnown.getStatusCode())
                .isEqualTo(HttpStatus.OK);
        assertThat(body(forUnknown).path("message").asText())
                .isEqualTo(body(forKnown).path("message").asText());
        assertThat(MailpitSupport.messages().stream().anyMatch(m -> m.to().equalsIgnoreCase(unknown)))
                .as("no mail goes to an address without an account")
                .isFalse();
    }

    @Test
    void wrongPasswordIsUnauthorizedInTheStandardEnvelope() {
        Session session = register("Gustavo");

        ResponseEntity<String> response =
                anonymous(HttpMethod.POST, LOGIN, Map.of("email", session.email(), "password", "wrong-password"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        JsonNode body = body(response);
        assertThat(body.path("success").asBoolean()).isFalse();
        assertThat(body.path("message").asText()).isEqualTo("Credenciais inválidas");
        assertThat(body.path("data").path("status").asInt()).isEqualTo(401);
        assertThat(setCookie(response)).as("no cookie on a failed login").isNull();
    }

    @Test
    void aSecondRegistrationForTheSameAddressAnswersLikeTheFirst() {
        Session session = register("Helena");

        ResponseEntity<String> response = anonymous(
                HttpMethod.POST, REGISTER, Map.of("name", "Helena", "email", session.email(), "password", PASSWORD));

        // It used to answer 422 "e-mail already registered", which told anyone with a list of
        // addresses which of them belong to users. RegisterEnumerationIT compares the two
        // answers field by field; this one pins the status the endpoint now always gives.
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.ACCEPTED);
    }

    @Test
    void invalidRegistrationIsA400ThatNamesTheFields() {
        ResponseEntity<String> response =
                anonymous(HttpMethod.POST, REGISTER, Map.of("name", "", "email", "not-an-email", "password", "short"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        JsonNode violations = data(response).path("violations");
        assertThat(violations.valueStream().map(v -> v.path("field").asText()))
                .containsExactlyInAnyOrder("name", "email", "password");
    }

    @Test
    void protectedRoutesRejectMissingAndForgedTokens() {
        ResponseEntity<String> missing = anonymous(HttpMethod.GET, "/api/v1/users/me", null);
        assertThat(missing.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);

        Session forged = new Session(null, null, null, "eyJhbGciOiJIUzI1NiJ9.forged.signature", null);
        ResponseEntity<String> tampered = httpGet("/api/v1/users/me", forged);
        assertThat(tampered.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    private static String setCookie(ResponseEntity<String> response) {
        return response.getHeaders().getOrEmpty(HttpHeaders.SET_COOKIE).stream()
                .filter(cookie -> cookie.startsWith("vp_refresh="))
                .findFirst()
                .orElse(null);
    }
}
