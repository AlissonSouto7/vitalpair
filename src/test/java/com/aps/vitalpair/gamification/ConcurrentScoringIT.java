package com.aps.vitalpair.gamification;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Callable;
import java.util.concurrent.CyclicBarrier;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import com.aps.vitalpair.support.AbstractIntegrationTest;
import com.fasterxml.jackson.databind.JsonNode;

/**
 * Two things happening at once against the scoreboard.
 *
 * <p>Scoring is a read-modify-write with no lock and no version column: {@code StreakService}
 * reads the streak, decides whether the day has already counted, and saves; {@code
 * CompetitionService} reads the week's row, adds in Java, and saves. Nothing in either path
 * serialises two callers, so the questions this test answers are whether points get lost and
 * whether the ledger still agrees with the scoreboard afterwards.
 *
 * <p>The ledger agreeing with the scoreboard is the invariant the whole design rests on: the
 * season screen never reads the scoreboard, it re-sums {@code point_events} over the season
 * window, and V16 states in its header that the two must match exactly.
 */
class ConcurrentScoringIT extends AbstractIntegrationTest {

    private static final int PARALLEL_MEALS = 6;

    /**
     * The same user logging several meals at once.
     *
     * <p>Only the first meal of the day should score, because the streak gate is what stops
     * a person farming points by logging breakfast ten times. Whether that holds when the
     * calls overlap is the question: the gate reads and writes one row with no lock.
     */
    @Test
    void severalMealsLoggedAtOnceScoreOnlyOnce() throws Exception {
        Session user = register("Racer");

        Overlap run = inParallel(
                PARALLEL_MEALS,
                () -> httpPost(
                        "/api/v1/nutrition/logs",
                        Map.of(
                                "foodName", "Banana",
                                "quantityG", 100,
                                "caloriesKcal", 89,
                                "mealType", "SNACK",
                                "source", "MANUAL"),
                        user));

        run.assertRequestsReallyOverlapped();
        for (Future<ResponseEntity<String>> result : run.futures()) {
            assertThat(result.get().getStatusCode()).isEqualTo(HttpStatus.CREATED);
        }

        // Listeners run after the originating commit, in their own transaction, so the score
        // lands shortly after the response. Poll rather than sleep a fixed amount.
        int score = awaitScore(user);

        assertThat(score)
                .as("a day's first meal is worth 10 points, and only the first meal counts")
                .isEqualTo(10);
    }

    /**
     * The scoreboard and the ledger are written one after the other on every award. If a
     * concurrent write is lost from the scoreboard but not from the insert-only ledger, the
     * season screen and the weekly competition disagree, permanently and silently.
     */
    @Test
    void theLedgerStillAgreesWithTheScoreboardAfterConcurrentScoring() throws Exception {
        Session user = register("Racer");

        Overlap run = inParallel(
                PARALLEL_MEALS,
                () -> httpPost(
                        "/api/v1/nutrition/logs",
                        Map.of(
                                "foodName", "Rice",
                                "quantityG", 150,
                                "caloriesKcal", 200,
                                "mealType", "LUNCH",
                                "source", "MANUAL"),
                        user));
        run.assertRequestsReallyOverlapped();
        for (Future<ResponseEntity<String>> result : run.futures()) {
            result.get();
        }

        int scoreboard = awaitScore(user);
        int ledger = seasonPoints(user);

        assertThat(ledger)
                .as("the season re-sums point_events; V16 promises it matches the scoreboard")
                .isEqualTo(scoreboard);
    }

    /**
     * Runs the same call from several threads, released together by a barrier.
     *
     * <p>The barrier is what makes this a concurrency test rather than a slow sequential one.
     * Without it the threads start as the pool schedules them and the first request can be
     * finished before the last begins, which is how a race test quietly stops testing a race.
     * The caller checks {@link Overlap#happened()} to confirm the requests really did run at
     * the same time.
     */
    private Overlap inParallel(int count, Callable<ResponseEntity<String>> call) throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(count);
        CyclicBarrier startTogether = new CyclicBarrier(count);
        AtomicInteger inFlight = new AtomicInteger();
        AtomicInteger peak = new AtomicInteger();
        try {
            List<Callable<ResponseEntity<String>>> calls = new ArrayList<>();
            for (int i = 0; i < count; i++) {
                calls.add(() -> {
                    startTogether.await(20, TimeUnit.SECONDS);
                    peak.accumulateAndGet(inFlight.incrementAndGet(), Math::max);
                    try {
                        return call.call();
                    } finally {
                        inFlight.decrementAndGet();
                    }
                });
            }
            List<Future<ResponseEntity<String>>> futures = pool.invokeAll(calls);
            pool.shutdown();
            assertThat(pool.awaitTermination(30, TimeUnit.SECONDS)).isTrue();
            return new Overlap(futures, peak.get());
        } finally {
            pool.shutdownNow();
        }
    }

    /**
     * The results of a parallel run, plus how many of the calls were ever in flight at once.
     *
     * @param peakInFlight 1 means the calls never overlapped and the test proved nothing
     */
    private record Overlap(List<Future<ResponseEntity<String>>> futures, int peakInFlight) {

        void assertRequestsReallyOverlapped() {
            assertThat(peakInFlight)
                    .as("the requests must actually run at the same time for this to be a race test")
                    .isGreaterThan(1);
        }
    }

    /** The caller's own points in this week's competition, once the listeners have run. */
    private int awaitScore(Session user) throws InterruptedException {
        int last = 0;
        for (int attempt = 0; attempt < 40; attempt++) {
            last = scoreOf(user);
            if (last > 0) {
                // Give any straggling listener a moment to land before reading the total, so
                // a slow second award is counted rather than silently passing the assertion.
                Thread.sleep(250);
                return scoreOf(user);
            }
            Thread.sleep(100);
        }
        return last;
    }

    private int scoreOf(Session user) {
        JsonNode competition = data(httpGet("/api/v1/gamification/competition", user));
        // The caller registered alone, so they are user1 of their own pending pair.
        return competition.path("user1Score").asInt();
    }

    private int seasonPoints(Session user) {
        JsonNode season = data(httpGet("/api/v1/season", user));
        assertThat(season.path("you").isMissingNode())
                .as("season view: %s", season)
                .isFalse();
        return season.path("you").path("score").asInt();
    }
}
