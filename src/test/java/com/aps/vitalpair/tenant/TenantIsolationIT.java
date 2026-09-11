package com.aps.vitalpair.tenant;

import static com.github.tomakehurst.wiremock.client.WireMock.aResponse;
import static com.github.tomakehurst.wiremock.client.WireMock.post;
import static com.github.tomakehurst.wiremock.client.WireMock.urlPathEqualTo;
import static org.assertj.core.api.Assertions.assertThat;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.aps.vitalpair.support.AbstractIntegrationTest;
import com.aps.vitalpair.support.WireMockSupport;
import com.aps.vitalpair.user.domain.model.Goal;
import com.fasterxml.jackson.databind.JsonNode;

/**
 * Two pairs, live in the same database, must never see each other.
 *
 * <p>This is the test the whole phase exists for. The application has no Hibernate filter
 * and no row-level security: isolation rests on every query remembering to scope by owner,
 * which is a promise no compiler checks. Here two complete pairs are built with real data
 * on both sides, and every authenticated read is asserted to return only its own.
 *
 * <p>{@link #everyControllerIsCoveredByThisTest()} closes the obvious gap in that approach.
 * A list of endpoints only proves something about the endpoints on it, so the list is
 * checked against the controllers Spring actually loaded: adding a controller without
 * covering it here fails the build instead of quietly shipping an unaudited route.
 */
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class TenantIsolationIT extends AbstractIntegrationTest {

    /** Controllers whose data is not owned by a tenant, with the reason each is exempt. */
    private static final Map<String, String> NOT_TENANT_SCOPED = Map.of(
            "AuthController", "unauthenticated by design; covered by AuthFlowIT",
            "AdminStatsController", "role-guarded, deliberately global; covered by AdminStatsControllerTest",
            "NutritionPhotoController", "stateless analysis, stores nothing");

    @Autowired
    private JdbcTemplate jdbc;

    private Pair alpha;
    private Pair beta;

    /** Both members of one pair, sharing a tenant. */
    private record Pair(Session owner, Session partner, String label) {}

    @BeforeEach
    void buildTwoIndependentPairs() {
        if (alpha != null) {
            return;
        }
        alpha = buildPair("Alpha");
        beta = buildPair("Beta");
    }

    private Pair buildPair(String label) {
        Session owner = register(label + "Owner");
        Session partner = register(label + "Partner");
        completeProfile(owner, Goal.GAIN_MUSCLE);
        completeProfile(partner, Goal.LOSE_WEIGHT);
        Session joined = pairUp(owner, partner);

        // Real data on both sides, so a leak has something recognisable to leak.
        logMeal(owner, label + " breakfast", 500);
        logMeal(joined, label + " partner lunch", 600);
        logActivity(owner, 45);
        httpPost("/api/v1/progress/weight", Map.of("weightKg", 80), owner);
        httpPut("/api/v1/season/stake", Map.of("stake", label + " stake"), owner);
        // The plan is behind the paid plan; the owner pays so the fixture can have one.
        grantPremium(owner);
        generateMealPlan(owner, label);

        return new Pair(owner, joined, label);
    }

    // ---- reads ----

    static List<String> authenticatedReads() {
        return List.of(
                "/api/v1/users/me",
                "/api/v1/users/me/tdee",
                "/api/v1/pair",
                "/api/v1/dashboard",
                "/api/v1/nutrition/logs",
                "/api/v1/nutrition/summary",
                "/api/v1/nutrition/favorites",
                "/api/v1/activity/logs",
                "/api/v1/activity/summary",
                "/api/v1/progress",
                "/api/v1/season",
                "/api/v1/pair/feed",
                "/api/v1/gamification/streaks",
                "/api/v1/gamification/competition",
                "/api/v1/gamification/badges",
                "/api/v1/missions/flash",
                "/api/v1/missions/weekly",
                "/api/v1/notifications",
                "/api/v1/me/notification-prefs",
                "/api/v1/meal-plan",
                "/api/v1/workout-plan/today",
                "/api/v1/entitlements/me");
    }

    @ParameterizedTest(name = "{0} never leaks the other pair")
    @MethodSource("authenticatedReads")
    void aReadNeverContainsTheOtherPairsData(String path) {
        ResponseEntity<String> mine = httpGet(path, alpha.owner());
        ResponseEntity<String> theirs = httpGet(path, beta.owner());

        assertThat(mine.getStatusCode())
                .as("%s for alpha: %s", path, mine.getBody())
                .isEqualTo(HttpStatus.OK);
        assertThat(theirs.getStatusCode())
                .as("%s for beta: %s", path, theirs.getBody())
                .isEqualTo(HttpStatus.OK);

        // Identifiers are the strongest signal: no response may carry a user id, a pair id
        // or a name belonging to the other tenant.
        assertThat(mine.getBody()).doesNotContain(beta.owner().userId().toString());
        assertThat(mine.getBody()).doesNotContain(beta.partner().userId().toString());
        assertThat(mine.getBody()).doesNotContain("Beta");
        assertThat(theirs.getBody()).doesNotContain(alpha.owner().userId().toString());
        assertThat(theirs.getBody()).doesNotContain(alpha.partner().userId().toString());
        assertThat(theirs.getBody()).doesNotContain("Alpha");
    }

    @Test
    void aPairSeesItsOwnPartnerButNotTheOtherPairs() {
        JsonNode pair = data(httpGet("/api/v1/pair", alpha.owner()));

        String body = pair.toString();
        assertThat(body).contains(alpha.partner().userId().toString());
        assertThat(body).doesNotContain(beta.partner().userId().toString());
        assertThat(pair.path("status").asText()).isEqualTo("ACTIVE");
    }

    @Test
    void theFeedShowsOnlyTheOwnPairsActivity() {
        JsonNode feed = data(httpGet("/api/v1/pair/feed", alpha.owner()));

        Set<String> actors = feed.path("content")
                .valueStream()
                .map(item -> item.path("userId").asText())
                .collect(Collectors.toSet());
        assertThat(actors)
                .isSubsetOf(Set.of(
                        alpha.owner().userId().toString(),
                        alpha.partner().userId().toString()));
        assertThat(feed.path("content")).isNotEmpty();
        assertThat(feed.toString()).doesNotContain("Beta");
    }

    @Test
    void theMealPlanBelongsToThePairThatGeneratedIt() {
        JsonNode alphaPlan = data(httpGet("/api/v1/meal-plan", alpha.owner()));
        JsonNode betaPlan = data(httpGet("/api/v1/meal-plan", beta.owner()));

        // The two pairs generated deliberately different menus. Reading the wrong tenant's
        // plan therefore shows up as the wrong dish names, not merely as a missing id.
        assertThat(alphaPlan.toString()).doesNotContain("BETA ");
        assertThat(betaPlan.path("days")
                        .path(0)
                        .path("meals")
                        .path(0)
                        .path("name")
                        .asText())
                .startsWith("BETA ");
        assertThat(alphaPlan
                        .path("days")
                        .path(0)
                        .path("meals")
                        .path(0)
                        .path("name")
                        .asText())
                .doesNotStartWith("BETA ");
    }

    @Test
    void theDashboardShowsTheOwnPartnersProgress() {
        JsonNode dashboard = data(httpGet("/api/v1/dashboard", alpha.owner()));

        assertThat(dashboard.path("partner").path("userId").asText())
                .isEqualTo(alpha.partner().userId().toString());
        // The owner logged a 500 kcal meal today; the partner logged 600 of their own.
        assertThat(dashboard.path("me").path("consumedCalories").asInt()).isEqualTo(500);
        assertThat(dashboard.path("partner").path("consumedCalories").asInt()).isEqualTo(600);
    }

    // ---- writes on another tenant's rows ----

    @Test
    void deletingAnotherUsersFoodLogFails() {
        UUID victimLog = UUID.fromString(data(httpGet("/api/v1/nutrition/logs", beta.owner()))
                .path(0)
                .path("id")
                .asText());

        ResponseEntity<String> response = httpDelete("/api/v1/nutrition/logs/" + victimLog, alpha.owner());

        assertThat(response.getStatusCode()).isIn(HttpStatus.NOT_FOUND, HttpStatus.FORBIDDEN);
        assertThat(data(httpGet("/api/v1/nutrition/logs", beta.owner())))
                .as("the victim's log must still be there")
                .isNotEmpty();
    }

    @Test
    void reactingToAnotherPairsFeedItemFails() {
        JsonNode victimFeed = data(httpGet("/api/v1/pair/feed", beta.owner()));
        String itemId = victimFeed.path("content").path(0).path("id").asText();

        ResponseEntity<String> response =
                httpPost("/api/v1/pair/feed/" + itemId + "/reactions", Map.of("type", "FIRE"), alpha.owner());

        assertThat(response.getStatusCode())
                .isIn(HttpStatus.NOT_FOUND, HttpStatus.FORBIDDEN, HttpStatus.UNPROCESSABLE_ENTITY);
        assertThat(httpGet("/api/v1/pair/feed", beta.owner()).getBody())
                .doesNotContain(alpha.owner().userId().toString());
    }

    @Test
    void togglingAnotherUsersWorkoutExerciseFails() {
        generateWorkoutPlan(beta.owner());
        JsonNode today = data(httpGet("/api/v1/workout-plan/today", beta.owner()));
        if (today.path("rest").asBoolean() || today.path("exercises").isEmpty()) {
            // The fixture rests on two weekdays; nothing to toggle then.
            return;
        }
        String exerciseId = today.path("exercises").path(0).path("id").asText();

        ResponseEntity<String> response =
                httpPost("/api/v1/workout-plan/exercises/" + exerciseId + "/toggle", null, alpha.owner());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(data(httpGet("/api/v1/workout-plan/today", beta.owner()))
                        .path("exercises")
                        .path(0)
                        .path("done")
                        .asBoolean())
                .as("the victim's exercise must stay untouched")
                .isFalse();
    }

    /**
     * A third person cannot attach themselves to a pair that is already complete.
     *
     * <p>The invite code of a formed pair is not even obtainable through the API, since
     * generating one is refused once the pair is active. The code is therefore read straight
     * from the database, which is the strongest form of the attack: an attacker who somehow
     * learned the code still gets nowhere.
     */
    @Test
    void joiningAnAlreadyFormedPairIsRejected() {
        ResponseEntity<String> refused = httpPost("/api/v1/pair/invite", null, beta.owner());
        assertThat(refused.getStatusCode()).isEqualTo(HttpStatus.UNPROCESSABLE_ENTITY);
        assertThat(body(refused).path("message").asText()).isEqualTo("Você já tem um parceiro");

        String code = jdbc.queryForObject(
                "select invite_code from pairs where id = (select tenant_id from users where id = ?)",
                String.class,
                beta.owner().userId());
        Session outsider = register("Outsider");

        ResponseEntity<String> response = httpPost("/api/v1/pair/join/" + code, null, outsider);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNPROCESSABLE_ENTITY);
        assertThat(body(response).path("message").asText()).isEqualTo("Este convite não está mais disponível");
        assertThat(httpGet("/api/v1/pair", beta.owner()).getBody())
                .doesNotContain(outsider.userId().toString());
    }

    // ---- the list above must stay complete ----

    @Autowired
    private ApplicationContext context;

    @Test
    void everyControllerIsCoveredByThisTest() {
        List<String> uncovered = new ArrayList<>();
        List<String> covered = authenticatedReads();

        for (Object controller :
                context.getBeansWithAnnotation(RestController.class).values()) {
            Class<?> type = org.springframework.aop.support.AopUtils.getTargetClass(controller);
            String name = type.getSimpleName();
            if (NOT_TENANT_SCOPED.containsKey(name)) {
                continue;
            }
            RequestMapping mapping = type.getAnnotation(RequestMapping.class);
            String base = mapping == null || mapping.value().length == 0 ? "" : mapping.value()[0];
            boolean listed = covered.stream().anyMatch(path -> path.startsWith(base));
            if (!listed) {
                uncovered.add(name + " (" + base + ")");
            }
        }

        assertThat(uncovered)
                .as("a controller with no entry in authenticatedReads() is a route nobody proved is tenant-scoped;"
                        + " add its read here, or list it in NOT_TENANT_SCOPED with the reason")
                .isEmpty();
    }

    // ---- helpers ----

    private void logMeal(Session session, String food, int kcal) {
        ResponseEntity<String> response = httpPost(
                "/api/v1/nutrition/logs",
                Map.of(
                        "foodName",
                        food,
                        "quantityG",
                        200,
                        "caloriesKcal",
                        kcal,
                        "proteinG",
                        30,
                        "carbG",
                        40,
                        "fatG",
                        10,
                        "mealType",
                        "LUNCH",
                        "source",
                        "MANUAL",
                        "isPrivate",
                        false),
                session);
        assertThat(response.getStatusCode()).as(response.getBody()).isEqualTo(HttpStatus.CREATED);
    }

    private void logActivity(Session session, int minutes) {
        ResponseEntity<String> response = httpPost(
                "/api/v1/activity/logs",
                Map.of(
                        "activityType",
                        "WORKOUT",
                        "durationMinutes",
                        minutes,
                        "caloriesBurned",
                        300,
                        "source",
                        "MANUAL"),
                session);
        assertThat(response.getStatusCode()).as(response.getBody()).isEqualTo(HttpStatus.CREATED);
    }

    /**
     * Generates a plan whose dish names carry the pair's label.
     *
     * <p>Both pairs used to receive the same fixture, which made the leak assertions
     * meaningless for this endpoint: identical dish names cannot reveal a cross-tenant read.
     * Deliberately breaking the tenant filter proved it, and the build stayed green. With a
     * labelled fixture per pair, the same sabotage fails the test.
     */
    private void generateMealPlan(Session session, String label) {
        stubAnthropic("Beta".equals(label) ? "anthropic/meal-week-beta.json" : "anthropic/meal-week.json");
        assertThat(httpPost("/api/v1/meal-plan/generate", null, session).getStatusCode())
                .isEqualTo(HttpStatus.OK);
    }

    private void generateWorkoutPlan(Session session) {
        stubAnthropic("anthropic/workout-week.json");
        assertThat(httpPost("/api/v1/workout-plan/generate", null, session).getStatusCode())
                .isEqualTo(HttpStatus.OK);
    }

    private static void stubAnthropic(String fixture) {
        WireMockSupport.server()
                .stubFor(post(urlPathEqualTo(WireMockSupport.ANTHROPIC_PREFIX + "/v1/messages"))
                        .willReturn(aResponse()
                                .withStatus(200)
                                .withHeader("Content-Type", "application/json")
                                .withBodyFile(fixture)));
    }
}
