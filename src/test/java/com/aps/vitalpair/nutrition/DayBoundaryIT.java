package com.aps.vitalpair.nutrition;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.Map;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import com.aps.vitalpair.support.AbstractIntegrationTest;
import com.fasterxml.jackson.databind.JsonNode;

/**
 * The day a meal belongs to is the user's day, not the server's.
 *
 * <p>The bug: the controller asked {@code LocalDate.now()} in the JVM's zone while the query ran
 * over a window built in UTC. The two agreed only when the two zones did. In UTC-3, a meal logged
 * at 21:35 local saved with a 201 and then vanished from the day's list, every evening, for the
 * last three hours of every day.
 *
 * <p>These tests do not depend on the wall clock of the machine running them. They log meals at
 * chosen instants and ask for the day those instants belong to in a chosen zone, which is the
 * only way to exercise a boundary without waiting for 21:00 to come round.
 */
class DayBoundaryIT extends AbstractIntegrationTest {

    private static final ZoneId SAO_PAULO = ZoneId.of("America/Sao_Paulo");
    private static final ZoneId TOKYO = ZoneId.of("Asia/Tokyo");

    @Test
    @DisplayName("a meal logged late in the evening stays on the day it was eaten")
    void aMealLoggedLateInTheEveningStaysOnTheDayItWasEaten() {
        Session session = register("Noturno");
        setZone(session, SAO_PAULO);

        // 22:30 in Sao Paulo on 15 May. In UTC that is 01:30 on the 16th, so a window built in
        // UTC for the 15th excludes it and a window built in Sao Paulo includes it. This one
        // instant is the whole bug.
        ZonedDateTime dinner = ZonedDateTime.of(2026, 5, 15, 22, 30, 0, 0, SAO_PAULO);
        logMeal(session, "Jantar tardio", 600, dinner.toInstant());

        JsonNode logs = data(httpGet("/api/v1/nutrition/logs?date=2026-05-15", session));
        assertThat(logs).hasSize(1);
        assertThat(logs.get(0).path("foodName").asText()).isEqualTo("Jantar tardio");

        // And it is not also on the next day, which would be the same bug pointing the other way.
        assertThat(data(httpGet("/api/v1/nutrition/logs?date=2026-05-16", session)))
                .isEmpty();
    }

    @Test
    @DisplayName("the day's totals count the same meals the day's list shows")
    void theDaysTotalsCountTheSameMealsTheDaysListShows() {
        Session session = register("Somatorio");
        setZone(session, SAO_PAULO);

        ZonedDateTime lateEvening = ZonedDateTime.of(2026, 5, 15, 23, 45, 0, 0, SAO_PAULO);
        logMeal(session, "Lanche da meia-noite", 350, lateEvening.toInstant());

        JsonNode summary = data(httpGet("/api/v1/nutrition/summary?date=2026-05-15", session));
        assertThat(summary.path("consumedCalories").asInt()).isEqualTo(350);
        assertThat(summary.path("mealCount").asInt()).isEqualTo(1);
    }

    @Test
    @DisplayName("two people in different zones cut the same instant into different days")
    void twoPeopleInDifferentZonesCutTheSameInstantIntoDifferentDays() {
        Session brazil = register("Brasil");
        setZone(brazil, SAO_PAULO);
        Session japan = register("Japao");
        setZone(japan, TOKYO);

        // 15 May, 23:00 in Sao Paulo is 16 May, 11:00 in Tokyo: the same instant, two dates.
        // This is what makes the zone a property of the person and not a constant in the code.
        Instant sameInstant =
                ZonedDateTime.of(2026, 5, 15, 23, 0, 0, 0, SAO_PAULO).toInstant();
        logMeal(brazil, "Feijoada", 800, sameInstant);
        logMeal(japan, "Ramen", 800, sameInstant);

        assertThat(data(httpGet("/api/v1/nutrition/logs?date=2026-05-15", brazil)))
                .hasSize(1);
        assertThat(data(httpGet("/api/v1/nutrition/logs?date=2026-05-16", japan)))
                .hasSize(1);
    }

    @Test
    @DisplayName("changing the zone moves which day a meal is counted on")
    void changingTheZoneMovesWhichDayAMealIsCountedOn() {
        Session session = register("Viajante");
        setZone(session, SAO_PAULO);

        Instant meal = ZonedDateTime.of(2026, 5, 15, 23, 0, 0, 0, SAO_PAULO).toInstant();
        logMeal(session, "Pizza", 900, meal);
        assertThat(data(httpGet("/api/v1/nutrition/logs?date=2026-05-15", session)))
                .hasSize(1);

        // The preference is what decides, so changing it changes the answer for meals already
        // logged. That is the honest behaviour: the day is derived, not stored.
        setZone(session, TOKYO);
        assertThat(data(httpGet("/api/v1/nutrition/logs?date=2026-05-15", session)))
                .isEmpty();
        assertThat(data(httpGet("/api/v1/nutrition/logs?date=2026-05-16", session)))
                .hasSize(1);
    }

    @Test
    @DisplayName("with no date the server answers for today where the user is")
    void withNoDateTheServerAnswersForTodayWhereTheUserIs() {
        Session session = register("Hoje");
        setZone(session, TOKYO);

        // Now, wherever this test happens to run. Asking without a date has to answer for the
        // user's own today, which is what the meal is logged against.
        Instant now = Instant.now();
        LocalDate todayInTokyo = now.atZone(TOKYO).toLocalDate();
        logMeal(session, "Almoco", 500, now);

        assertThat(data(httpGet("/api/v1/nutrition/logs", session))).hasSize(1);
        assertThat(data(httpGet("/api/v1/nutrition/logs?date=" + todayInTokyo, session)))
                .hasSize(1);
    }

    @Test
    @DisplayName("the progress chart buckets a meal on the day the person ate it")
    void theProgressChartBucketsAMealOnTheDayThePersonAteIt() {
        Session session = register("Grafico");
        setZone(session, TOKYO);

        // Late enough in Tokyo that the same instant is still the previous day in UTC. The chart
        // groups per day inside SQL, so this is the only place that bucketing is exercised.
        ZonedDateTime lateNight = ZonedDateTime.now(TOKYO).withHour(8).withMinute(30);
        logMeal(session, "Cafe da manha", 400, lateNight.toInstant());

        JsonNode progress = data(httpGet("/api/v1/progress", session));
        JsonNode today = null;
        for (JsonNode day : progress.path("calories")) {
            if (day.path("date").asText().equals(lateNight.toLocalDate().toString())) {
                today = day;
            }
        }
        assertThat(today)
                .as("the chart has a bar for the day the meal was eaten")
                .isNotNull();
        assertThat(today.path("kcal").asInt()).isEqualTo(400);
    }

    @Test
    @DisplayName("a zone the server cannot resolve is refused")
    void aZoneTheServerCannotResolveIsRefused() {
        Session session = register("Invalido");
        ResponseEntity<String> response = httpPut("/api/v1/users/me", profileWith("Mars/Olympus_Mons"), session);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    @DisplayName("omitting the zone leaves the stored one alone")
    void omittingTheZoneLeavesTheStoredOneAlone() {
        Session session = register("Silencioso");
        setZone(session, TOKYO);

        // A client that does not know about the field must not reset it, which is why the
        // update treats absent as "unchanged" rather than as "clear".
        Map<String, Object> withoutZone = profileWith(null);
        withoutZone.remove("timeZone");
        assertThat(httpPut("/api/v1/users/me", withoutZone, session).getStatusCode())
                .isEqualTo(HttpStatus.OK);

        assertThat(data(httpGet("/api/v1/users/me", session)).path("timeZone").asText())
                .isEqualTo("Asia/Tokyo");
    }

    @Test
    @DisplayName("a new account starts in the product's default zone")
    void aNewAccountStartsInTheProductsDefaultZone() {
        Session session = register("Novato");
        assertThat(data(httpGet("/api/v1/users/me", session)).path("timeZone").asText())
                .isEqualTo("America/Sao_Paulo");
    }

    // ---- helpers ----

    private void setZone(Session session, ZoneId zone) {
        ResponseEntity<String> response = httpPut("/api/v1/users/me", profileWith(zone.getId()), session);
        assertThat(response.getStatusCode())
                .as("set zone %s: %s", zone, response.getBody())
                .isEqualTo(HttpStatus.OK);
    }

    /** A complete, valid profile. Only the zone varies, so nothing else can explain a failure. */
    private Map<String, Object> profileWith(String zone) {
        Map<String, Object> profile = new java.util.HashMap<>(Map.of(
                "name", "Tester",
                "birthDate", "1995-04-10",
                "sex", "MALE",
                "heightCm", 178,
                "weightKg", 75,
                "goal", "LOSE_WEIGHT",
                "activityLevel", "MODERATE"));
        if (zone != null) {
            profile.put("timeZone", zone);
        }
        return profile;
    }

    private void logMeal(Session session, String food, int calories, Instant loggedAt) {
        ResponseEntity<String> response = httpPost(
                "/api/v1/nutrition/logs",
                Map.of(
                        "foodName",
                        food,
                        "quantityG",
                        200,
                        "caloriesKcal",
                        calories,
                        "mealType",
                        "DINNER",
                        "source",
                        "MANUAL",
                        "loggedAt",
                        loggedAt.toString()),
                session);
        assertThat(response.getStatusCode())
                .as("log %s: %s", food, response.getBody())
                .isEqualTo(HttpStatus.CREATED);
        assertThat(Duration.between(
                        loggedAt, Instant.parse(data(response).path("loggedAt").asText())))
                .as("the server stored the instant it was given")
                .isZero();
    }
}
