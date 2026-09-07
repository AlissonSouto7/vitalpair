package com.aps.vitalpair.shared.metrics;

import java.time.Duration;

import org.springframework.stereotype.Component;

import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;

/**
 * Counts and times the calls to Anthropic.
 *
 * <p>Every one of these costs money and takes seconds, which makes them the two questions
 * worth answering from outside the application: how many are being made, and how many are
 * failing. Without a counter, a partner outage looks like "users are complaining" and a
 * runaway cost is discovered on the invoice.
 *
 * <p>The tags are deliberately few. {@code kind} separates the three call sites, {@code
 * outcome} separates success from failure. A tag with unbounded values, a user id for
 * instance, creates one time series per value and eventually takes the metrics store down.
 */
@Component
public class AiMetrics {

    private static final String REQUESTS = "vitalpair.ai.requests";
    private static final String LATENCY = "vitalpair.ai.latency";

    private final MeterRegistry registry;

    public AiMetrics(MeterRegistry registry) {
        this.registry = registry;
    }

    /**
     * Records one call.
     *
     * @param kind which call it was: {@code meal-plan}, {@code workout-plan}, {@code meal-swap} or
     *     {@code meal-photo}
     * @param outcome {@code success} or {@code failure}
     */
    public void record(String kind, String outcome, Duration elapsed) {
        registry.counter(REQUESTS, "kind", kind, "outcome", outcome).increment();
        Timer.builder(LATENCY)
                .tag("kind", kind)
                .tag("outcome", outcome)
                .publishPercentileHistogram()
                .register(registry)
                .record(elapsed);
    }

    /** Times a call and records its outcome, whichever way it ends. */
    public <T> T timed(String kind, java.util.function.Supplier<T> call) {
        long started = System.nanoTime();
        String outcome = "failure";
        try {
            T result = call.get();
            outcome = "success";
            return result;
        } finally {
            record(kind, outcome, Duration.ofNanos(System.nanoTime() - started));
        }
    }
}
