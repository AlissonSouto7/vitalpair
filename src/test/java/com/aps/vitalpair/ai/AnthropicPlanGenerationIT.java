package com.aps.vitalpair.ai;

import static com.github.tomakehurst.wiremock.client.WireMock.aResponse;
import static com.github.tomakehurst.wiremock.client.WireMock.equalTo;
import static com.github.tomakehurst.wiremock.client.WireMock.matchingJsonPath;
import static com.github.tomakehurst.wiremock.client.WireMock.post;
import static com.github.tomakehurst.wiremock.client.WireMock.postRequestedFor;
import static com.github.tomakehurst.wiremock.client.WireMock.urlPathEqualTo;
import static org.assertj.core.api.Assertions.assertThat;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;

import com.aps.vitalpair.support.AbstractIntegrationTest;
import com.aps.vitalpair.support.WireMockSupport;
import com.aps.vitalpair.user.domain.model.Goal;
import com.fasterxml.jackson.databind.JsonNode;
import com.github.tomakehurst.wiremock.http.Fault;

/**
 * Plan generation against a stubbed Anthropic, using responses captured from the real API.
 *
 * <p>Both integrations broke once because a Feign proxy could not reach a package-private
 * type, and nothing caught it: the failure is a runtime {@code IllegalAccessError} inside a
 * generated proxy, invisible to a mocked port. These tests exercise the whole path, request
 * body included, so that class of failure fails the build.
 *
 * <p>The unhappy paths matter as much as the happy one. Anthropic returns 529 when
 * overloaded, refuses a request the model will not answer, and sometimes just stops
 * responding; each has to reach the user as a handled 502, never a 500.
 */
class AnthropicPlanGenerationIT extends AbstractIntegrationTest {

    private static final String MESSAGES = WireMockSupport.ANTHROPIC_PREFIX + "/v1/messages";
    private static final String MEAL_PLAN = "/api/v1/meal-plan";
    private static final String WORKOUT_PLAN = "/api/v1/workout-plan";

    @Autowired
    private JdbcTemplate jdbc;

    @Test
    void generatesAndStoresTheWeeklyMealPlan() {
        Session session = register("Nina");
        completeProfile(session, Goal.GAIN_MUSCLE);
        grantPremium(session);
        stubJson("anthropic/meal-week.json");

        ResponseEntity<String> response = httpPost(MEAL_PLAN + "/generate", null, session);

        assertThat(response.getStatusCode()).as(response.getBody()).isEqualTo(HttpStatus.OK);
        JsonNode plan = data(response);
        assertThat(plan.path("weekStart").asText()).isEqualTo(currentWeekStart().toString());
        assertThat(plan.path("targetKcal").asInt()).isPositive();
        assertThat(plan.path("days")).hasSize(7);
        assertThat(plan.path("days").path(0).path("meals")).hasSize(4);
        assertThat(plan.path("days").path(0).path("meals").path(0).path("name").asText())
                .isNotBlank();

        // The prompt has to carry the user's real target, otherwise the plan is generic.
        int target = plan.path("targetKcal").asInt();
        WireMockSupport.server()
                .verify(postRequestedFor(urlPathEqualTo(MESSAGES))
                        .withHeader("x-api-key", equalTo("test-api-key"))
                        .withHeader("anthropic-version", equalTo("2023-06-01"))
                        .withRequestBody(matchingJsonPath("$.output_config.format.type", equalTo("json_schema")))
                        .withRequestBody(matchingJsonPath(
                                "$.messages[0].content[0].text",
                                com.github.tomakehurst.wiremock.client.WireMock.containing(target + " kcal"))));

        // Stored, not just returned: the next GET must serve it without calling the API again.
        WireMockSupport.server().resetAll();
        JsonNode reread = data(httpGet(MEAL_PLAN, session));
        assertThat(reread.path("days")).hasSize(7);
        assertThat(WireMockSupport.server().getAllServeEvents()).isEmpty();
    }

    @Test
    void generatingAgainReplacesTheWeekInsteadOfDuplicatingIt() {
        Session session = register("Otto");
        completeProfile(session, Goal.GAIN_MUSCLE);
        grantPremium(session);
        stubJson("anthropic/meal-week.json");

        httpPost(MEAL_PLAN + "/generate", null, session);
        String firstMeal = data(httpGet(MEAL_PLAN, session))
                .path("days")
                .path(0)
                .path("meals")
                .path(0)
                .path("name")
                .asText();
        httpPost(MEAL_PLAN + "/generate", null, session);

        JsonNode plan = data(httpGet(MEAL_PLAN, session));
        assertThat(plan.path("days")).hasSize(7);
        assertThat(plan.path("days").path(0).path("meals")).hasSize(4);
        assertThat(plan.path("days").path(0).path("meals").path(0).path("name").asText())
                .isEqualTo(firstMeal);
    }

    @Test
    void swappingAMealKeepsTheRestOfTheWeekUntouched() {
        Session session = register("Paula");
        completeProfile(session, Goal.GAIN_MUSCLE);
        grantPremium(session);
        stubJson("anthropic/meal-week.json");
        httpPost(MEAL_PLAN + "/generate", null, session);
        JsonNode before = data(httpGet(MEAL_PLAN, session));
        String otherDayMeal =
                before.path("days").path(1).path("meals").path(1).path("name").asText();

        stubJson("anthropic/meal-swap.json");
        ResponseEntity<String> response =
                httpPost(MEAL_PLAN + "/swap", Map.of("dayIndex", 0, "mealType", "LUNCH"), session);

        assertThat(response.getStatusCode()).as(response.getBody()).isEqualTo(HttpStatus.OK);
        JsonNode after = data(response);
        JsonNode swapped = mealOf(after, 0, "LUNCH");
        // Exactly as the captured response spells it, accent included ("file", not "filé").
        assertThat(swapped.path("name").asText()).isEqualTo("Arroz integral com feijão e file de frango");
        assertThat(swapped.path("kcal").asInt()).isEqualTo(760);
        assertThat(after.path("days").path(1).path("meals").path(1).path("name").asText())
                .isEqualTo(otherDayMeal);
        assertThat(after.path("days")).hasSize(7);
    }

    @Test
    void generatesTheWeeklyWorkoutAndShowsToday() {
        Session session = register("Quela");
        completeProfile(session, Goal.GAIN_MUSCLE);
        grantPremium(session);
        stubJson("anthropic/workout-week.json");

        ResponseEntity<String> response = httpPost(WORKOUT_PLAN + "/generate", null, session);

        assertThat(response.getStatusCode()).as(response.getBody()).isEqualTo(HttpStatus.OK);
        JsonNode today = data(response);
        assertThat(today.path("goal").asText()).isEqualTo("GAIN_MUSCLE");
        assertThat(today.path("dayIndex").asInt())
                .isEqualTo(LocalDate.now().getDayOfWeek().getValue() - 1);
        // The fixture rests on Wednesday and Sunday; every other day carries six exercises.
        boolean restToday = today.path("rest").asBoolean();
        if (restToday) {
            assertThat(today.path("exercises")).isEmpty();
        } else {
            assertThat(today.path("exercises")).hasSize(6);
            assertThat(today.path("focus").asText()).isNotBlank();
            assertThat(today.path("durationMin").asInt()).isBetween(30, 60);
        }
    }

    @Test
    void anOverloadedApiBecomesA502NotA500() {
        Session session = register("Rui");
        completeProfile(session, Goal.GAIN_MUSCLE);
        grantPremium(session);
        WireMockSupport.server()
                .stubFor(post(urlPathEqualTo(MESSAGES))
                        .willReturn(aResponse()
                                .withStatus(529)
                                .withHeader("Content-Type", "application/json")
                                .withBody("{\"type\":\"error\",\"error\":{\"type\":\"overloaded_error\"}}")));

        ResponseEntity<String> response = httpPost(MEAL_PLAN + "/generate", null, session);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_GATEWAY);
        assertThat(body(response).path("message").asText())
                .isEqualTo("Não foi possível gerar o plano agora. Tente novamente em instantes.");
        assertThat(data(httpGet(MEAL_PLAN, session)).isNull())
                .as("a failed generation stores nothing")
                .isTrue();
    }

    @Test
    void aRefusalBecomesA502WithItsOwnMessage() {
        Session session = register("Sara");
        completeProfile(session, Goal.GAIN_MUSCLE);
        grantPremium(session);
        WireMockSupport.server()
                .stubFor(post(urlPathEqualTo(MESSAGES))
                        .willReturn(aResponse()
                                .withStatus(200)
                                .withHeader("Content-Type", "application/json")
                                .withBody("{\"content\":[],\"stop_reason\":\"refusal\"}")));

        ResponseEntity<String> response = httpPost(MEAL_PLAN + "/generate", null, session);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_GATEWAY);
        assertThat(body(response).path("message").asText())
                .isEqualTo("A IA não conseguiu montar o plano. Tente novamente.");
    }

    @Test
    void aResponseThatNeverArrivesTimesOutAsA502() {
        Session session = register("Tina");
        completeProfile(session, Goal.GAIN_MUSCLE);
        grantPremium(session);
        // The read timeout is 3s under the test profile, against 60s in production.
        WireMockSupport.server()
                .stubFor(post(urlPathEqualTo(MESSAGES))
                        .willReturn(aResponse()
                                .withStatus(200)
                                .withFixedDelay(6000)
                                .withHeader("Content-Type", "application/json")
                                .withBody("{\"content\":[],\"stop_reason\":\"end_turn\"}")));

        long started = System.nanoTime();
        ResponseEntity<String> response = httpPost(MEAL_PLAN + "/generate", null, session);
        long elapsedMs = (System.nanoTime() - started) / 1_000_000;

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_GATEWAY);
        assertThat(elapsedMs)
                .as("must give up on the read timeout, not wait for the response")
                .isLessThan(5500);
    }

    @Test
    void aDroppedConnectionBecomesA502() {
        Session session = register("Ugo");
        completeProfile(session, Goal.GAIN_MUSCLE);
        grantPremium(session);
        WireMockSupport.server()
                .stubFor(post(urlPathEqualTo(MESSAGES))
                        .willReturn(aResponse().withFault(Fault.CONNECTION_RESET_BY_PEER)));

        ResponseEntity<String> response = httpPost(MEAL_PLAN + "/generate", null, session);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_GATEWAY);
    }

    @Test
    void malformedJsonFromTheModelBecomesA502() {
        Session session = register("Vera");
        completeProfile(session, Goal.GAIN_MUSCLE);
        grantPremium(session);
        WireMockSupport.server()
                .stubFor(
                        post(urlPathEqualTo(MESSAGES))
                                .willReturn(
                                        aResponse()
                                                .withStatus(200)
                                                .withHeader("Content-Type", "application/json")
                                                .withBody(
                                                        "{\"content\":[{\"type\":\"text\",\"text\":\"{not json\"}],\"stop_reason\":\"end_turn\"}")));

        ResponseEntity<String> response = httpPost(MEAL_PLAN + "/generate", null, session);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_GATEWAY);
        assertThat(body(response).path("message").asText())
                .isEqualTo("A IA retornou um resultado em formato inesperado.");
    }

    @Test
    void anIncompleteProfileIsRejectedBeforeSpendingMoney() {
        Session session = register("Wanda");
        // Past the paid-plan door on purpose: the door answers first, and this test is about
        // the refusal that comes right after it.
        grantPremium(session);
        stubJson("anthropic/meal-week.json");

        ResponseEntity<String> response = httpPost(MEAL_PLAN + "/generate", null, session);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNPROCESSABLE_ENTITY);
        assertThat(body(response).path("message").asText())
                .isEqualTo("Termina teu perfil primeiro que eu monto o cardápio na tua meta.");
        assertThat(WireMockSupport.server().getAllServeEvents())
                .as("the paid API must not be called")
                .isEmpty();
    }

    @Test
    void swappingWithoutAPlanIsA404AndSwappingAnInvalidDayIsA400() {
        Session session = register("Xico");
        completeProfile(session, Goal.GAIN_MUSCLE);
        grantPremium(session);

        ResponseEntity<String> noPlan =
                httpPost(MEAL_PLAN + "/swap", Map.of("dayIndex", 0, "mealType", "LUNCH"), session);
        assertThat(noPlan.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);

        ResponseEntity<String> badDay =
                httpPost(MEAL_PLAN + "/swap", Map.of("dayIndex", 9, "mealType", "LUNCH"), session);
        assertThat(badDay.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(data(badDay).path("violations").path(0).path("message").asText())
                .isEqualTo("dayIndex deve estar entre 0 e 6");
    }

    /**
     * Regression for the 500 that shipped with migration V22.
     *
     * <p>V22 added a NOT NULL {@code tenant_id} to both plan tables, but no adapter wrote it,
     * so every generation failed on the INSERT and the handler turned the constraint violation
     * into "Erro interno inesperado". It went unnoticed because no plan had been generated
     * since the migration ran. The assertion is on the stored row, not just the response:
     * a plan that comes back but is not scoped to a tenant is the bug in a different shape.
     */
    @Test
    void aGeneratedPlanIsStoredWithItsTenant() {
        Session session = register("Yuri");
        completeProfile(session, Goal.GAIN_MUSCLE);
        grantPremium(session);
        stubJson("anthropic/meal-week.json");
        httpPost(MEAL_PLAN + "/generate", null, session);
        stubJson("anthropic/workout-week.json");
        httpPost(WORKOUT_PLAN + "/generate", null, session);

        UUID tenantId = jdbc.queryForObject("select tenant_id from users where id = ?", UUID.class, session.userId());
        assertThat(jdbc.queryForObject(
                        "select tenant_id from meal_plans where user_id = ?", UUID.class, session.userId()))
                .isEqualTo(tenantId);
        assertThat(jdbc.queryForObject(
                        "select tenant_id from workout_plans where user_id = ?", UUID.class, session.userId()))
                .isEqualTo(tenantId);
    }

    @Test
    void planEndpointsRequireAuthentication() {
        List<String> paths = List.of(MEAL_PLAN, MEAL_PLAN + "/generate", WORKOUT_PLAN + "/today");

        for (String path : paths) {
            ResponseEntity<String> response = anonymous(
                    path.endsWith("generate")
                            ? org.springframework.http.HttpMethod.POST
                            : org.springframework.http.HttpMethod.GET,
                    path,
                    null);
            assertThat(response.getStatusCode()).as(path).isEqualTo(HttpStatus.UNAUTHORIZED);
        }
    }

    private static void stubJson(String fixture) {
        WireMockSupport.server()
                .stubFor(post(urlPathEqualTo(MESSAGES))
                        .willReturn(aResponse()
                                .withStatus(200)
                                .withHeader("Content-Type", "application/json")
                                .withBodyFile(fixture)));
    }

    private static JsonNode mealOf(JsonNode plan, int dayIndex, String mealType) {
        return plan.path("days")
                .path(dayIndex)
                .path("meals")
                .valueStream()
                .filter(meal -> mealType.equals(meal.path("mealType").asText()))
                .findFirst()
                .orElseThrow(() -> new AssertionError("no " + mealType + " on day " + dayIndex));
    }

    private static LocalDate currentWeekStart() {
        return LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
    }
}
