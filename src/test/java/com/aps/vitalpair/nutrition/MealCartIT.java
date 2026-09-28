package com.aps.vitalpair.nutrition;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;

import com.aps.vitalpair.nutrition.application.scheduler.CartCleanupScheduler;
import com.aps.vitalpair.support.AbstractIntegrationTest;
import com.fasterxml.jackson.databind.JsonNode;

/**
 * Building a plate before recording it.
 *
 * <p>Somebody eating rice, beans and steak used to walk the whole logging flow three times and
 * end up with three separate diary lines for one meal. The cart stages the plate and writes it
 * in one go.
 *
 * <p>What these tests protect, worst first: that confirming is all or nothing, that a staged
 * item scores exactly like a directly logged one (the cart must not become a quieter path that
 * skips points, the pair feed and the notification), that nothing is written before the
 * confirmation, and that the request validation refuses a future date and an impossible
 * quantity at the edge rather than in the database.
 */
class MealCartIT extends AbstractIntegrationTest {

    @Autowired
    private CartCleanupScheduler cleanup;

    @Autowired
    private JdbcTemplate jdbc;

    @Test
    @DisplayName("what is staged is not in the diary until it is confirmed")
    void stagingDoesNotTouchTheDiary() {
        Session session = register("Carrinho");

        addToCart(session, "Arroz branco cozido", 128);
        addToCart(session, "Feijão carioca cozido", 76);

        assertThat(data(httpGet("/api/v1/nutrition/cart", session))).hasSize(2);
        assertThat(data(httpGet("/api/v1/nutrition/logs", session)))
                .as("nothing reaches the diary before the confirmation")
                .isEmpty();
        assertThat(data(httpGet("/api/v1/nutrition/summary", session))
                        .path("consumedCalories")
                        .asInt())
                .isZero();
    }

    @Test
    @DisplayName("confirming writes every item and empties the cart")
    void confirmingWritesEveryItemAndEmptiesTheCart() {
        Session session = register("Confirma");
        addToCart(session, "Arroz branco cozido", 128);
        addToCart(session, "Feijão carioca cozido", 76);
        addToCart(session, "Bife grelhado", 220);

        ResponseEntity<String> response = httpPost("/api/v1/nutrition/cart/checkout", null, session);

        assertThat(response.getStatusCode()).as(response.getBody()).isEqualTo(HttpStatus.CREATED);
        assertThat(data(response)).hasSize(3);
        assertThat(data(httpGet("/api/v1/nutrition/logs", session))).hasSize(3);
        assertThat(data(httpGet("/api/v1/nutrition/summary", session))
                        .path("consumedCalories")
                        .asInt())
                .isEqualTo(128 + 76 + 220);
        assertThat(data(httpGet("/api/v1/nutrition/cart", session)))
                .as("a confirmed cart is empty, or confirming twice logs the same lunch twice")
                .isEmpty();
    }

    @Test
    @DisplayName("a staged meal scores like a directly logged one")
    void aStagedMealScoresLikeADirectlyLoggedOne() {
        Session viaCart = register("PeloCarrinho");
        Session direct = register("Direto");

        addToCart(viaCart, "Arroz branco cozido", 128);
        assertThat(httpPost("/api/v1/nutrition/cart/checkout", null, viaCart).getStatusCode())
                .isEqualTo(HttpStatus.CREATED);
        logMealDirectly(direct, "Arroz branco cozido", 128);

        /*
         * The same score on both paths is the whole reason checkout goes through the logging use
         * case instead of writing rows itself. A cart that saved straight to the repository would
         * be a path that silently does not score, and nobody would understand why.
         */
        int cartScore = data(httpGet("/api/v1/gamification/competition", viaCart))
                .path("user1Score")
                .asInt();
        int directScore = data(httpGet("/api/v1/gamification/competition", direct))
                .path("user1Score")
                .asInt();
        assertThat(cartScore).isPositive().isEqualTo(directScore);
    }

    /**
     * Two taps on the confirm button cannot log the same lunch twice.
     *
     * <p>Checkout reads the cart, writes each item and then empties it. Those are separate
     * steps inside one transaction, so without a lock both requests read the same list before
     * either clears it, and the meal lands twice: two diary rows, two feed items, the points
     * counted twice. The read takes a row lock, which makes the loser wait, find the cart empty
     * and stop on the empty-cart rule.
     *
     * <p>This asserts the outcome, not the timing: exactly one 201, one refusal, and one meal
     * in the diary. A flaky scheduler cannot make a duplicated meal look like a pass.
     */
    @Test
    @DisplayName("confirming twice at the same instant logs the meal once")
    void confirmingTwiceAtTheSameInstantLogsTheMealOnce() throws Exception {
        Session session = register("DoisToques");
        addToCart(session, "Arroz branco cozido", 128);

        ExecutorService pool = Executors.newFixedThreadPool(2);
        try {
            CountDownLatch ready = new CountDownLatch(2);
            CountDownLatch go = new CountDownLatch(1);
            List<Future<HttpStatus>> calls = new ArrayList<>();
            for (int i = 0; i < 2; i++) {
                calls.add(pool.submit(() -> {
                    ready.countDown();
                    go.await();
                    return (HttpStatus) httpPost("/api/v1/nutrition/cart/checkout", null, session)
                            .getStatusCode();
                }));
            }
            assertThat(ready.await(10, TimeUnit.SECONDS)).isTrue();
            go.countDown();

            List<HttpStatus> statuses =
                    List.of(calls.get(0).get(30, TimeUnit.SECONDS), calls.get(1).get(30, TimeUnit.SECONDS));
            assertThat(statuses).containsExactlyInAnyOrder(HttpStatus.CREATED, HttpStatus.UNPROCESSABLE_ENTITY);
        } finally {
            pool.shutdownNow();
        }

        assertThat(data(httpGet("/api/v1/nutrition/logs", session)))
                .as("the same plate confirmed twice must reach the diary once")
                .hasSize(1);
        assertThat(data(httpGet("/api/v1/nutrition/cart", session))).isEmpty();
    }

    @Test
    @DisplayName("confirming an empty cart says so instead of pretending it worked")
    void confirmingAnEmptyCartSaysSo() {
        Session session = register("Vazio");

        ResponseEntity<String> response = httpPost("/api/v1/nutrition/cart/checkout", null, session);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNPROCESSABLE_ENTITY);
    }

    @Test
    @DisplayName("emptying the cart drops the items without logging them")
    void emptyingTheCartDropsTheItems() {
        Session session = register("Esvazia");
        addToCart(session, "Arroz branco cozido", 128);

        assertThat(httpDelete("/api/v1/nutrition/cart", session).getStatusCode())
                .isEqualTo(HttpStatus.OK);

        assertThat(data(httpGet("/api/v1/nutrition/cart", session))).isEmpty();
        assertThat(data(httpGet("/api/v1/nutrition/logs", session)))
                .as("discarding a plate must not log it")
                .isEmpty();
    }

    @Test
    @DisplayName("an item staged for a future day is refused")
    void anItemStagedForAFutureDayIsRefused() {
        Session session = register("DataFutura");
        Map<String, Object> request = cartRequest("Arroz branco cozido", 128);
        request.put("consumedOn", LocalDate.now().plus(2, ChronoUnit.DAYS).toString());

        ResponseEntity<String> response = httpPost("/api/v1/nutrition/cart/items", request, session);

        // The same reason a future loggedAt is refused on a meal: the streak, the ledger and the
        // weekly competition are counted by date, and a date ahead fabricates points.
        assertThat(response.getStatusCode()).as(response.getBody()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    @DisplayName("yesterday is a legitimate day to stage for")
    void yesterdayIsALegitimateDayToStageFor() {
        Session session = register("Ontem");
        String yesterday = LocalDate.now().minusDays(1).toString();
        Map<String, Object> request = cartRequest("Arroz branco cozido", 128);
        request.put("consumedOn", yesterday);

        assertThat(httpPost("/api/v1/nutrition/cart/items", request, session).getStatusCode())
                .isEqualTo(HttpStatus.CREATED);

        // Read back by day: the cart of today must not show what was staged for yesterday.
        assertThat(data(httpGet("/api/v1/nutrition/cart?date=" + yesterday, session)))
                .hasSize(1);
        assertThat(data(httpGet("/api/v1/nutrition/cart", session)))
                .as("staged for yesterday must not appear in today's cart")
                .isEmpty();
    }

    @Test
    @DisplayName("a zero-gram item is refused at the edge")
    void aZeroGramItemIsRefused() {
        Session session = register("ZeroGramas");
        Map<String, Object> request = cartRequest("Arroz branco cozido", 128);
        request.put("quantityG", 0);

        ResponseEntity<String> response = httpPost("/api/v1/nutrition/cart/items", request, session);

        assertThat(response.getStatusCode()).as(response.getBody()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    @DisplayName("omitting the macros stages the item with zeros instead of failing")
    void omittingTheMacrosStagesTheItemWithZeros() {
        Session session = register("SemMacros");

        /*
         * The search returns foods whose protein, carb and fat are unknown, and the manual form
         * lets somebody fill only the calories. The request marks those three optional, so a
         * client is entitled to omit them; the columns are NOT NULL, so the service has to turn
         * the absence into a zero the way the direct logging path already does. Without it this
         * is a 500 on an ordinary entry.
         */
        ResponseEntity<String> response = httpPost(
                "/api/v1/nutrition/cart/items",
                Map.of(
                        "foodName",
                        "Alimento sem macros",
                        "quantityG",
                        100,
                        "caloriesKcal",
                        128,
                        "mealType",
                        "LUNCH",
                        "source",
                        "MANUAL"),
                session);

        assertThat(response.getStatusCode()).as(response.getBody()).isEqualTo(HttpStatus.CREATED);
        JsonNode item = data(response);
        assertThat(item.path("proteinG").asInt()).isZero();
        assertThat(item.path("carbG").asInt()).isZero();
        assertThat(item.path("fatG").asInt()).isZero();
    }

    /**
     * The cleanup actually deletes, and only what has expired.
     *
     * <p>Recovery code that never ran is the code that fails when it is finally needed, so this
     * runs the scheduled method for real against the database instead of asserting on a mock.
     * The expiry is pushed into the past with a direct update, which is the only way to reach
     * the state without waiting two days.
     */
    @Test
    @DisplayName("the cleanup removes an expired cart and leaves a valid one alone")
    void theCleanupRemovesAnExpiredCartAndLeavesAValidOneAlone() {
        Session expired = register("Expirado");
        Session valid = register("Valido");
        addToCart(expired, "Arroz esquecido", 128);
        addToCart(valid, "Arroz de hoje", 128);
        jdbc.update(
                "update meal_cart_items set expires_at = now() - interval '1 hour' where user_id = ?",
                expired.userId());

        cleanup.removeExpiredCarts();

        assertThat(data(httpGet("/api/v1/nutrition/cart", expired)))
                .as("an expired cart must be gone")
                .isEmpty();
        assertThat(data(httpGet("/api/v1/nutrition/cart", valid)))
                .as("a cart that is still valid must survive the sweep")
                .hasSize(1);
    }

    @Test
    @DisplayName("the cart needs a signed-in caller")
    void theCartNeedsASignedInCaller() {
        assertThat(anonymous(org.springframework.http.HttpMethod.GET, "/api/v1/nutrition/cart", null)
                        .getStatusCode())
                .isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(anonymous(
                                org.springframework.http.HttpMethod.POST,
                                "/api/v1/nutrition/cart/items",
                                cartRequest("Arroz", 128))
                        .getStatusCode())
                .isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    private void addToCart(Session session, String food, int kcal) {
        ResponseEntity<String> response = httpPost("/api/v1/nutrition/cart/items", cartRequest(food, kcal), session);
        assertThat(response.getStatusCode()).as(response.getBody()).isEqualTo(HttpStatus.CREATED);
    }

    private static Map<String, Object> cartRequest(String food, int kcal) {
        Map<String, Object> request = new HashMap<>();
        request.put("foodName", food);
        request.put("quantityG", 100);
        request.put("caloriesKcal", kcal);
        request.put("proteinG", 5);
        request.put("carbG", 20);
        request.put("fatG", 2);
        request.put("mealType", "LUNCH");
        request.put("source", "MANUAL");
        request.put("isPrivate", false);
        return request;
    }

    private void logMealDirectly(Session session, String food, int kcal) {
        ResponseEntity<String> response = httpPost(
                "/api/v1/nutrition/logs",
                Map.of(
                        "foodName",
                        food,
                        "quantityG",
                        100,
                        "caloriesKcal",
                        kcal,
                        "proteinG",
                        5,
                        "carbG",
                        20,
                        "fatG",
                        2,
                        "mealType",
                        "LUNCH",
                        "source",
                        "MANUAL"),
                session);
        assertThat(response.getStatusCode()).as(response.getBody()).isEqualTo(HttpStatus.CREATED);
    }
}
