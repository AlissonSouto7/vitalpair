package com.aps.vitalpair.support;

import static org.assertj.core.api.Assertions.assertThat;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.context.annotation.Import;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import com.aps.vitalpair.auth.infrastructure.web.RefreshTokenCookie;
import com.aps.vitalpair.user.domain.model.Goal;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * Base for integration tests: the whole application on a random port, talking to real
 * Postgres, Redis and Mailpit in containers and to WireMock in place of Anthropic and Open
 * Food Facts.
 *
 * <p>Every subclass shares one application context, so the containers start once per build.
 * The price is that state leaks between tests unless it is reset here: WireMock stubs are
 * cleared and the rate-limit counters deleted before each test, because every test calls
 * from 127.0.0.1 and would otherwise inherit the previous test's login attempts.
 *
 * <p>Tests go through HTTP like a client would, cookies included, rather than calling
 * services directly. The bugs this suite exists to catch (a filter registered twice, a proxy
 * that cannot see a package-private type, a missing column) only show up on that path.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Import(TestcontainersConfiguration.class)
@ActiveProfiles("test")
public abstract class AbstractIntegrationTest {

    protected static final String PASSWORD = "Test@12345";

    /**
     * Gives the account a lifetime PREMIUM plan, straight in the database.
     *
     * <p>There is no endpoint for it on purpose: nobody has paid yet, and the day billing
     * exists it will write this column, not a test helper. Every test that reaches an AI
     * feature needs it, because a new account is FREE and the door is closed to FREE.
     */
    protected void grantPremium(Session session) {
        jdbcTemplate.update("update users set plan = 'PREMIUM', plan_expires_at = null where id = ?", session.userId());
    }

    @Autowired
    protected TestRestTemplate http;

    @Autowired
    protected ObjectMapper json;

    @Autowired
    protected StringRedisTemplate redis;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @DynamicPropertySource
    static void externalSystems(DynamicPropertyRegistry registry) {
        WireMockSupport.register(registry);
        MailpitSupport.register(registry);
    }

    @BeforeEach
    void isolateFromPreviousTests() {
        WireMockSupport.server().resetAll();
        clearRateLimitCounters();
    }

    /**
     * Forgets every rate-limit count.
     *
     * <p>Also useful mid-test: registering an account ends with a sign-in, which spends one of
     * the allowance a test about the login limit is trying to count.
     */
    protected void clearRateLimitCounters() {
        Set<String> counters = redis.keys("ratelimit:*");
        if (counters != null && !counters.isEmpty()) {
            redis.delete(counters);
        }
    }

    // ---- HTTP ----

    protected ResponseEntity<String> httpGet(String path, Session session) {
        return exchange(HttpMethod.GET, path, null, session);
    }

    protected ResponseEntity<String> httpPost(String path, Object body, Session session) {
        return exchange(HttpMethod.POST, path, body, session);
    }

    protected ResponseEntity<String> httpPut(String path, Object body, Session session) {
        return exchange(HttpMethod.PUT, path, body, session);
    }

    protected ResponseEntity<String> httpDelete(String path, Session session) {
        return exchange(HttpMethod.DELETE, path, null, session);
    }

    protected ResponseEntity<String> anonymous(HttpMethod method, String path, Object body) {
        return exchange(method, path, body, null);
    }

    protected ResponseEntity<String> exchange(HttpMethod method, String path, Object body, Session session) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
        if (session != null) {
            headers.setBearerAuth(session.accessToken());
        }
        return http.exchange(path, method, new HttpEntity<>(body == null ? null : toJson(body), headers), String.class);
    }

    /** Sends a request carrying the refresh cookie, the way a browser would on the auth routes. */
    protected ResponseEntity<String> withRefreshCookie(HttpMethod method, String path, String refreshToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
        if (refreshToken != null) {
            headers.add(HttpHeaders.COOKIE, RefreshTokenCookie.NAME + "=" + refreshToken);
        }
        return http.exchange(path, method, new HttpEntity<>(null, headers), String.class);
    }

    protected JsonNode body(ResponseEntity<String> response) {
        try {
            return json.readTree(response.getBody() == null ? "null" : response.getBody());
        } catch (JsonProcessingException ex) {
            throw new AssertionError("Response is not JSON: " + response.getBody(), ex);
        }
    }

    protected JsonNode data(ResponseEntity<String> response) {
        return body(response).path("data");
    }

    protected String toJson(Object value) {
        try {
            return json.writeValueAsString(value);
        } catch (JsonProcessingException ex) {
            throw new IllegalArgumentException(ex);
        }
    }

    // ---- accounts ----

    /** Registers a fresh account. The e-mail is unique per call, so tests never collide. */
    protected Session register(String name) {
        String email = uniqueEmail(name);
        ResponseEntity<String> response = anonymous(
                HttpMethod.POST, "/api/v1/auth/register", Map.of("name", name, "email", email, "password", PASSWORD));
        assertThat(response.getStatusCode())
                .as("register %s: %s", email, response.getBody())
                .isEqualTo(HttpStatus.ACCEPTED);

        // Registration no longer issues a session: it answers the same thing whether or not
        // the address already has an account, and the activation link is what turns the
        // account into one that can sign in. Going through the mailbox is what a person
        // does, so every test that needs an account exercises the real path.
        activate(email);
        Session session = login(email, PASSWORD);
        return new Session(session.userId(), email, name, session.accessToken(), session.refreshToken());
    }

    /** Opens the activation link the registration e-mail carries. */
    protected void activate(String email) {
        MailpitSupport.Mail mail = MailpitSupport.latestTo(email)
                .orElseThrow(() -> new AssertionError("no activation e-mail for " + email));
        String token = URLDecoder.decode(mail.token(), StandardCharsets.UTF_8);
        ResponseEntity<String> verify = anonymous(HttpMethod.POST, "/api/v1/auth/verify-email", Map.of("token", token));
        assertThat(verify.getStatusCode())
                .as("activate %s: %s", email, verify.getBody())
                .isEqualTo(HttpStatus.OK);
    }

    protected Session login(String email, String password) {
        ResponseEntity<String> response =
                anonymous(HttpMethod.POST, "/api/v1/auth/login", Map.of("email", email, "password", password));
        assertThat(response.getStatusCode())
                .as("login %s: %s", email, response.getBody())
                .isEqualTo(HttpStatus.OK);
        return sessionFrom(response, email, null);
    }

    protected Session sessionFrom(ResponseEntity<String> response, String email, String name) {
        JsonNode data = data(response);
        return new Session(
                UUID.fromString(data.path("userId").asText()),
                email,
                name,
                data.path("accessToken").asText(),
                refreshTokenFrom(response));
    }

    /** The refresh token value from the Set-Cookie header, or null when no cookie was set. */
    protected static String refreshTokenFrom(ResponseEntity<String> response) {
        List<String> cookies = response.getHeaders().getOrEmpty(HttpHeaders.SET_COOKIE);
        return cookies.stream()
                .filter(cookie -> cookie.startsWith(RefreshTokenCookie.NAME + "="))
                .map(cookie -> cookie.substring(RefreshTokenCookie.NAME.length() + 1, cookie.indexOf(';')))
                .findFirst()
                .orElse(null);
    }

    protected static String uniqueEmail(String name) {
        String local = name.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]", "");
        return local + "-" + UUID.randomUUID().toString().substring(0, 8) + "@test.vitalpair.app";
    }

    /** Fills in the profile fields the calorie and plan features require. */
    protected void completeProfile(Session session, Goal goal) {
        ResponseEntity<String> response = httpPut(
                "/api/v1/users/me",
                Map.of(
                        "name",
                        session.name() != null ? session.name() : "Tester",
                        "birthDate",
                        "1995-04-10",
                        "sex",
                        "MALE",
                        "heightCm",
                        178,
                        "weightKg",
                        75,
                        "goal",
                        goal.name(),
                        "activityLevel",
                        "MODERATE"),
                session);
        assertThat(response.getStatusCode())
                .as("complete profile: %s", response.getBody())
                .isEqualTo(HttpStatus.OK);
    }

    /**
     * Forms a pair and returns the joiner's new session.
     *
     * <p>Joining moves the joiner into the inviter's tenant, but the joiner's access token
     * still carries the old tenant id until it is renewed. Logging in again is what a real
     * client does at that point, and it is what makes the returned session trustworthy.
     */
    protected Session pairUp(Session inviter, Session joiner) {
        ResponseEntity<String> invite = httpPost("/api/v1/pair/invite", null, inviter);
        assertThat(invite.getStatusCode()).as("invite: %s", invite.getBody()).isEqualTo(HttpStatus.OK);
        String code = data(invite).path("inviteCode").asText();

        ResponseEntity<String> join = httpPost("/api/v1/pair/join/" + code, null, joiner);
        assertThat(join.getStatusCode()).as("join: %s", join.getBody()).isEqualTo(HttpStatus.OK);

        Session renewed = login(joiner.email(), PASSWORD);
        return new Session(
                renewed.userId(), joiner.email(), joiner.name(), renewed.accessToken(), renewed.refreshToken());
    }

    /**
     * An authenticated account as the test sees it.
     *
     * @param refreshToken the value of the refresh cookie set by the last auth response
     */
    public record Session(UUID userId, String email, String name, String accessToken, String refreshToken) {}
}
