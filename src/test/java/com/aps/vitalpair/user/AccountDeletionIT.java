package com.aps.vitalpair.user;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;

import com.aps.vitalpair.support.AbstractIntegrationTest;
import com.fasterxml.jackson.databind.JsonNode;

/**
 * Closing an account.
 *
 * <p>Three treatments, not one cascade. What the person recorded about themselves is
 * deleted. What describes a competition they took part in stays, with their identity
 * stripped out of it: the season history is summed live from the point ledger on every
 * read, so deleting those rows would recompute every past season with a rival score of zero
 * and hand the partner wins they did not earn. LGPD article 12 treats anonymised data as no
 * longer personal, which is what makes keeping it lawful and keeping the partner's history
 * honest at the same time.
 *
 * <p>The users row itself survives as a tombstone. Thirteen foreign keys point at it, all
 * NO ACTION, so it could not be deleted anyway; but the reason it stays is the paragraph
 * above, not the constraints.
 */
class AccountDeletionIT extends AbstractIntegrationTest {

    @Autowired
    private JdbcTemplate jdbc;

    @Test
    void closingAnAccountRemovesWhatThePersonRecordedAboutThemselves() {
        Session session = register("Departing");
        logMeal(session, "Banana");
        recordWeight(session, 78.5);

        assertThat(deleteAccount(session).getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);

        assertThat(countFor("food_logs", session)).isZero();
        assertThat(countFor("weight_logs", session)).isZero();
        assertThat(countFor("feed_items", session)).isZero();
        assertThat(countFor("notification_preferences", session)).isZero();
    }

    @Test
    void thePersonBecomesUnidentifiable() {
        Session session = register("Identifiable");
        completeProfile(session, com.aps.vitalpair.user.domain.model.Goal.LOSE_WEIGHT);

        assertThat(deleteAccount(session).getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);

        Map<String, Object> row = jdbc.queryForMap("SELECT * FROM users WHERE id = ?", session.userId());
        assertThat((String) row.get("email"))
                .as("the address is scrubbed so it cannot identify anyone")
                .doesNotContain(session.email());
        assertThat((String) row.get("name")).isNotEqualTo("Identifiable");
        assertThat(row.get("deleted_at")).as("the tombstone is marked").isNotNull();
        assertThat(row.get("password_hash")).isNull();
        assertThat(row.get("birth_date")).isNull();
        assertThat(row.get("height_cm")).isNull();
        assertThat(row.get("weight_kg")).isNull();
        assertThat(row.get("avatar_url")).isNull();
    }

    /**
     * The point of not deleting: the partner's history has to survive intact.
     */
    @Test
    void thePartnersSeasonHistoryIsUntouched() {
        Session inviter = register("Stayer");
        Session joiner = register("Leaver");
        pairUp(inviter, joiner);

        Session inviterPaired = login(inviter.email(), PASSWORD);
        Session joinerPaired = login(joiner.email(), PASSWORD);
        logMeal(inviterPaired, "Arroz");
        logMeal(joinerPaired, "Feijao");

        JsonNode seasonBefore = data(httpGet("/api/v1/season", inviterPaired));
        int rivalScoreBefore = seasonBefore.path("rival").path("score").asInt();
        assertThat(rivalScoreBefore).as("the rival scored before leaving").isPositive();

        assertThat(deleteAccount(joinerPaired).getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);

        // The ledger rows are the thing that must not disappear.
        assertThat(countFor("point_events", joinerPaired))
                .as("the ledger of a competition that happened is kept")
                .isPositive();

        Session stayer = login(inviter.email(), PASSWORD);
        JsonNode seasonAfter = data(httpGet("/api/v1/season", stayer));
        assertThat(seasonAfter.path("you").path("score").asInt())
                .as("the person who stayed keeps their own score")
                .isEqualTo(seasonBefore.path("you").path("score").asInt());
    }

    @Test
    void theClosedAccountCannotBeUsedAgain() {
        Session session = register("Gone");
        String refreshToken = session.refreshToken();

        assertThat(deleteAccount(session).getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);

        assertThat(withRefreshCookie(HttpMethod.POST, "/api/v1/auth/refresh", refreshToken)
                        .getStatusCode())
                .as("the session it was closed from is dead")
                .isEqualTo(HttpStatus.UNAUTHORIZED);

        ResponseEntity<String> login = anonymous(
                HttpMethod.POST, "/api/v1/auth/login", Map.of("email", session.email(), "password", PASSWORD));
        assertThat(login.getStatusCode()).as("and so is the password").isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    /**
     * Someone who closes an account must be able to come back with the same address.
     *
     * <p>{@code users.email} is UNIQUE, so leaving the old value in place would lock the
     * person out of their own e-mail address for good.
     */
    @Test
    void theAddressIsFreedForANewAccount() {
        Session session = register("Returning");
        String email = session.email();

        assertThat(deleteAccount(session).getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);

        ResponseEntity<String> again = anonymous(
                HttpMethod.POST,
                "/api/v1/auth/register",
                Map.of("name", "Returning", "email", email, "password", PASSWORD));
        assertThat(again.getStatusCode())
                .as("registering again with the same address: %s", again.getBody())
                .isEqualTo(HttpStatus.CREATED);
    }

    /**
     * Closing while paired must not strand the partner in a pair with a tombstone.
     */
    @Test
    void closingWhilePairedLeavesThePartnerFreeToStartOver() {
        Session inviter = register("Remaining");
        Session joiner = register("Closing");
        pairUp(inviter, joiner);

        Session joinerPaired = login(joiner.email(), PASSWORD);
        assertThat(deleteAccount(joinerPaired).getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);

        Session remaining = login(inviter.email(), PASSWORD);
        JsonNode pair = data(httpGet("/api/v1/pair", remaining));
        assertThat(pair.path("status").asText()).isEqualTo("PENDING");
        assertThat(pair.path("members")).hasSize(1);
        assertThat(pair.path("inviteCode").asText()).isNotBlank();
    }

    @Test
    void closingRequiresBeingSignedIn() {
        assertThat(anonymous(HttpMethod.DELETE, "/api/v1/users/me", null).getStatusCode())
                .isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    private ResponseEntity<String> deleteAccount(Session session) {
        return httpDelete("/api/v1/users/me", session);
    }

    private Integer countFor(String table, Session session) {
        return jdbc.queryForObject(
                "SELECT count(*) FROM " + table + " WHERE user_id = ?", Integer.class, session.userId());
    }

    private void logMeal(Session session, String foodName) {
        ResponseEntity<String> logged = httpPost(
                "/api/v1/nutrition/logs",
                Map.of(
                        "foodName",
                        foodName,
                        "quantityG",
                        100,
                        "caloriesKcal",
                        89,
                        "mealType",
                        "BREAKFAST",
                        "source",
                        "MANUAL"),
                session);
        assertThat(logged.getStatusCode())
                .as("log a meal: %s", logged.getBody())
                .isEqualTo(HttpStatus.CREATED);
    }

    private void recordWeight(Session session, double weightKg) {
        assertThat(httpPost("/api/v1/progress/weight", Map.of("weightKg", weightKg), session)
                        .getStatusCode())
                .isIn(List.of(HttpStatus.OK, HttpStatus.CREATED, HttpStatus.NO_CONTENT));
    }
}
