package com.aps.vitalpair.feed;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import com.aps.vitalpair.support.AbstractIntegrationTest;
import com.fasterxml.jackson.databind.JsonNode;

/**
 * What "private" means when two people share a feed.
 *
 * <p>Marking a meal private is the product's one privacy control, and it is a promise made
 * to somebody who may be embarrassed about what they ate. It was enforced by a predicate in
 * one JPQL query and by an early return in one listener, with nothing proving either.
 *
 * <p>The promise is deliberately narrow, and these tests pin both halves of it: the partner
 * never learns <em>what</em> was eaten, and the meal still counts. Privacy that cost points
 * would not be a privacy control, it would be a penalty, and nobody would use it.
 */
class MealPrivacyIT extends AbstractIntegrationTest {

    private static Map<String, Object> meal(String name, boolean isPrivate) {
        return Map.of(
                "foodName", name,
                "quantityG", 200,
                "caloriesKcal", 350,
                "proteinG", 20,
                "carbG", 40,
                "fatG", 10,
                "mealType", "SNACK",
                "source", "MANUAL",
                "isPrivate", isPrivate);
    }

    @Test
    void aPrivateMealNeverReachesThePartnersFeed() {
        Session inviter = register("Inviter");
        Session joiner = register("Joiner");
        Session paired = pairUp(inviter, joiner);
        Session owner = login(inviter.email(), PASSWORD);

        assertThat(httpPost("/api/v1/nutrition/logs", meal("Segredo do Alisson", true), owner)
                        .getStatusCode())
                .isEqualTo(HttpStatus.CREATED);
        assertThat(httpPost("/api/v1/nutrition/logs", meal("Salada publica", false), owner)
                        .getStatusCode())
                .isEqualTo(HttpStatus.CREATED);

        ResponseEntity<String> partnerFeed = httpGet("/api/v1/pair/feed", paired);
        assertThat(partnerFeed.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(partnerFeed.getBody())
                .as("the private meal must not appear in the partner's feed")
                .doesNotContain("Segredo do Alisson")
                .contains("Salada publica");
    }

    @Test
    void theAuthorStillSeesTheirOwnPrivateMeal() {
        Session inviter = register("Inviter");
        Session joiner = register("Joiner");
        pairUp(inviter, joiner);
        Session owner = login(inviter.email(), PASSWORD);

        httpPost("/api/v1/nutrition/logs", meal("Segredo do Alisson", true), owner);

        ResponseEntity<String> ownFeed = httpGet("/api/v1/pair/feed", owner);
        assertThat(ownFeed.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(ownFeed.getBody())
                .as("hiding it from its own author would make the feature useless")
                .contains("Segredo do Alisson");
    }

    /**
     * The scoreboard is a count of effort, not a description of it. A private meal that
     * scored nothing would turn the privacy toggle into a self-imposed handicap, and the
     * partner would infer the private meal anyway from the points that never arrived.
     */
    @Test
    void aPrivateMealStillScores() {
        Session solo = register("Solo");

        assertThat(httpPost("/api/v1/nutrition/logs", meal("Segredo", true), solo)
                        .getStatusCode())
                .isEqualTo(HttpStatus.CREATED);

        int score = awaitScore(solo);
        assertThat(score)
                .as("a private meal is worth the same 10 points as any other")
                .isEqualTo(10);
    }

    @Test
    void aPrivateMealIsNotVisibleThroughAnotherPairsFeedEither() {
        Session outsider = register("Outsider");
        Session inviter = register("Inviter");
        Session joiner = register("Joiner");
        pairUp(inviter, joiner);
        Session owner = login(inviter.email(), PASSWORD);

        httpPost("/api/v1/nutrition/logs", meal("Segredo do Alisson", true), owner);

        ResponseEntity<String> otherFeed = httpGet("/api/v1/pair/feed", outsider);
        assertThat(otherFeed.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(otherFeed.getBody()).doesNotContain("Segredo do Alisson");
    }

    /** Listeners run after the commit, in their own transaction, so the score lands shortly after. */
    private int awaitScore(Session user) {
        for (int attempt = 0; attempt < 40; attempt++) {
            JsonNode competition = data(httpGet("/api/v1/gamification/competition", user));
            int score = competition.path("user1Score").asInt();
            if (score > 0) {
                return score;
            }
            try {
                Thread.sleep(100);
            } catch (InterruptedException ex) {
                Thread.currentThread().interrupt();
                throw new AssertionError(ex);
            }
        }
        return 0;
    }
}
