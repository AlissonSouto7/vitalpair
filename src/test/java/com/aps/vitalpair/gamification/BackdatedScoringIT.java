package com.aps.vitalpair.gamification;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import com.aps.vitalpair.support.AbstractIntegrationTest;
import com.fasterxml.jackson.databind.JsonNode;

/**
 * The score is earned by doing the thing, not by choosing the date it happened.
 *
 * <p>The hole: {@code loggedAt} came straight from the client with no upper bound, and the
 * streak, the point ledger and the weekly competition are all keyed on that date. Seven logs
 * carrying seven future dates fabricated a seven-day streak, its milestone bonus and the
 * winning score in one burst, beating a partner who had actually trained. These tests send a
 * future date and require the server to refuse it, and then prove an honest backdated entry
 * (yesterday) still works, so the fix bounds the future without forbidding a real correction.
 */
class BackdatedScoringIT extends AbstractIntegrationTest {

    @Test
    @DisplayName("an activity logged in the future is refused")
    void anActivityLoggedInTheFutureIsRefused() {
        Session session = register("Trapaceiro");
        Instant tomorrow = Instant.now().plus(1, ChronoUnit.DAYS);

        ResponseEntity<String> response = logActivityAt(session, tomorrow);

        assertThat(response.getStatusCode())
                .as("a future loggedAt must be a 400, was: %s", response.getBody())
                .isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    @DisplayName("a meal logged in the future is refused")
    void aMealLoggedInTheFutureIsRefused() {
        Session session = register("TrapaceiroRefeicao");
        Instant tomorrow = Instant.now().plus(1, ChronoUnit.DAYS);

        ResponseEntity<String> response = logMealAt(session, tomorrow);

        assertThat(response.getStatusCode())
                .as("a future loggedAt must be a 400, was: %s", response.getBody())
                .isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    @DisplayName("the future-date streak exploit no longer inflates the score")
    void theFutureDateStreakExploitNoLongerInflatesTheScore() {
        Session session = register("Placar");
        Instant base = Instant.now();

        // The exploit: seven distinct days, each a day after the last, all in the future. Before
        // the fix every one returned 201 and the seventh crossed the streak milestone, worth the
        // base points seven times plus the fifty-point bonus. After the fix none of them count.
        for (int day = 1; day <= 7; day++) {
            logActivityAt(session, base.plus(day, ChronoUnit.DAYS));
        }

        JsonNode competition = data(httpGet("/api/v1/gamification/competition", session));
        assertThat(competition.path("user1Score").asInt())
                .as("no future-dated activity should have scored")
                .isZero();

        JsonNode streaks = data(httpGet("/api/v1/gamification/streaks", session));
        assertThat(streaks)
                .as("no streak should have been fabricated from future dates")
                .isEmpty();
    }

    @Test
    @DisplayName("an honest backdated entry (yesterday) is still accepted")
    void anHonestBackdatedEntryIsStillAccepted() {
        Session session = register("Retroativo");
        Instant yesterday = Instant.now().minus(1, ChronoUnit.DAYS);

        ResponseEntity<String> response = logActivityAt(session, yesterday);

        assertThat(response.getStatusCode())
                .as("a past loggedAt is a legitimate correction and must pass: %s", response.getBody())
                .isEqualTo(HttpStatus.CREATED);
    }

    @Test
    @DisplayName("omitting loggedAt still logs against now")
    void omittingLoggedAtStillLogsAgainstNow() {
        Session session = register("Agora");

        ResponseEntity<String> response = httpPost(
                "/api/v1/activity/logs",
                Map.of("activityType", "WORKOUT", "source", "MANUAL", "durationMinutes", 30),
                session);

        assertThat(response.getStatusCode())
                .as("no loggedAt means now, which must pass: %s", response.getBody())
                .isEqualTo(HttpStatus.CREATED);
    }

    private ResponseEntity<String> logActivityAt(Session session, Instant loggedAt) {
        return httpPost(
                "/api/v1/activity/logs",
                Map.of(
                        "activityType",
                        "WORKOUT",
                        "source",
                        "MANUAL",
                        "durationMinutes",
                        30,
                        "loggedAt",
                        loggedAt.toString()),
                session);
    }

    private ResponseEntity<String> logMealAt(Session session, Instant loggedAt) {
        return httpPost(
                "/api/v1/nutrition/logs",
                Map.of(
                        "foodName",
                        "Arroz",
                        "quantityG",
                        100,
                        "caloriesKcal",
                        130,
                        "mealType",
                        "LUNCH",
                        "source",
                        "MANUAL",
                        "loggedAt",
                        loggedAt.toString()),
                session);
    }
}
