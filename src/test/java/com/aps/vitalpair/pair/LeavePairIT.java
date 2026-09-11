package com.aps.vitalpair.pair;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import com.aps.vitalpair.support.AbstractIntegrationTest;
import com.aps.vitalpair.user.domain.model.UserTimeZones;
import com.fasterxml.jackson.databind.JsonNode;

/**
 * Leaving a pair.
 *
 * <p>Until this existed the pair was permanent: {@code joinPair} refuses anyone who already
 * has an active partner, and nothing could end one. A person who fell out with their
 * partner, or whose partner simply stopped using the app, had an account that could never
 * compete again.
 *
 * <p>The hard part is not the leaving, it is what the two people keep. A season is a
 * competition that happened, with a stake somebody paid, and the score behind it is summed
 * live from the ledger every time the history is opened. Deleting the leaver's rows would
 * not merely remove them: it would recompute every past season with a rival score of zero
 * and turn the seasons they won into the partner's victories. So the ledger stays and the
 * pair keeps its history; what ends is the competing.
 */
class LeavePairIT extends AbstractIntegrationTest {

    @Test
    void leavingEndsThePairAndGivesBothPeopleAFreshInviteCode() {
        Session inviter = register("Inviter");
        Session joiner = register("Joiner");
        pairUp(inviter, joiner);

        ResponseEntity<String> leave = httpDelete("/api/v1/pair/membership", inviter);
        assertThat(leave.getStatusCode()).as("leave: %s", leave.getBody()).isEqualTo(HttpStatus.OK);

        // The leaver is alone again, with their own code to start over.
        Session leaverNow = login(inviter.email(), PASSWORD);
        JsonNode leaverPair = data(httpGet("/api/v1/pair", leaverNow));
        assertThat(leaverPair.path("status").asText()).isEqualTo("PENDING");
        assertThat(leaverPair.path("members")).hasSize(1);
        assertThat(leaverPair.path("inviteCode").asText()).isNotBlank();

        // So is the person who stayed, and their code is a different one.
        JsonNode stayerPair = data(httpGet("/api/v1/pair", joiner));
        assertThat(stayerPair.path("status").asText()).isEqualTo("PENDING");
        assertThat(stayerPair.path("members")).hasSize(1);
        assertThat(stayerPair.path("inviteCode").asText())
                .isNotEqualTo(leaverPair.path("inviteCode").asText());
    }

    /**
     * The point of the whole feature: being able to pair with someone else afterwards.
     */
    @Test
    void afterLeavingTheUserCanPairWithSomeoneElse() {
        Session first = register("First");
        Session second = register("Second");
        pairUp(first, second);

        assertThat(httpDelete("/api/v1/pair/membership", first).getStatusCode()).isEqualTo(HttpStatus.OK);

        Session third = register("Third");
        Session firstNow = login(first.email(), PASSWORD);

        String code = data(httpPost("/api/v1/pair/invite", null, firstNow))
                .path("inviteCode")
                .asText();
        ResponseEntity<String> join = httpPost("/api/v1/pair/join/" + code, null, third);

        assertThat(join.getStatusCode())
                .as("join a new partner: %s", join.getBody())
                .isEqualTo(HttpStatus.OK);
        assertThat(data(join).path("status").asText()).isEqualTo("ACTIVE");
        assertThat(data(join).path("pairName").asText()).isEqualTo("First & Third");
    }

    /**
     * What each person takes with them.
     *
     * <p>Checked through the feed rather than through the meals themselves. Both are
     * migrated, but the meal list is queried by user id, so a meal stays visible whether or
     * not it moved; the feed is queried by tenant, so it is the one that actually says
     * whether the rows followed the person. A row left pointing at the ended pair would be
     * unreachable by every tenant-scoped query, which is data loss that nothing announces.
     *
     * <p>Both people are checked. The pair keeps the inviter's original tenant, so the
     * inviter's rows are the ones already pointing at the tenant being ended; the joiner's
     * moved once already, when they joined, and have to move again.
     */
    @Test
    void whatEachPersonLoggedFollowsThem() {
        Session inviter = register("Inviter");
        Session joiner = register("Joiner");
        pairUp(inviter, joiner);

        Session inviterPaired = login(inviter.email(), PASSWORD);
        Session joinerPaired = login(joiner.email(), PASSWORD);
        logMeal(inviterPaired, "Banana");
        logMeal(joinerPaired, "Ovo");

        assertThat(httpDelete("/api/v1/pair/membership", joinerPaired).getStatusCode())
                .isEqualTo(HttpStatus.OK);

        Session inviterAlone = login(inviter.email(), PASSWORD);
        assertThat(feedActors(inviterAlone))
                .as("the inviter's own history followed them out")
                .containsExactly("Inviter");

        Session joinerAlone = login(joiner.email(), PASSWORD);
        assertThat(feedActors(joinerAlone)).as("and so did the joiner's").containsExactly("Joiner");

        // The meals themselves are still there, read by user id rather than by tenant.
        // Today as the API counts it, in the person's zone. LocalDate.now() is today where the
        // JVM is, which on a UTC runner is already tomorrow every night from 21:00 in Brasília.
        JsonNode logs =
                data(httpGet("/api/v1/nutrition/logs?date=" + LocalDate.now(UserTimeZones.FALLBACK), inviterAlone));
        assertThat(logs).hasSize(1);
        assertThat(logs.get(0).path("foodName").asText()).isEqualTo("Banana");
    }

    /** Who wrote each entry the caller can see on their own timeline. */
    private List<String> feedActors(Session session) {
        JsonNode feed = data(httpGet("/api/v1/pair/feed?page=0&size=20", session));
        List<String> actors = new ArrayList<>();
        feed.path("content").forEach(item -> actors.add(item.path("actorName").asText()));
        return actors;
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

    @Test
    void someoneWithNoPartnerHasNothingToLeave() {
        Session alone = register("Alone");

        ResponseEntity<String> leave = httpDelete("/api/v1/pair/membership", alone);

        assertThat(leave.getStatusCode()).isEqualTo(HttpStatus.UNPROCESSABLE_ENTITY);
        assertThat(body(leave).path("message").asText()).isNotBlank();
    }

    @Test
    void leavingRequiresBeingSignedIn() {
        ResponseEntity<String> leave =
                anonymous(org.springframework.http.HttpMethod.DELETE, "/api/v1/pair/membership", null);

        assertThat(leave.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }
}
