package com.aps.vitalpair.shared.ratelimit;

import java.time.Duration;

/**
 * Outcome of a rate limit check.
 *
 * @param allowed whether the request may proceed
 * @param remaining requests left in the window, zero when denied
 * @param retryAfter how long until the window resets, only meaningful when denied
 */
public record RateLimitResult(boolean allowed, int remaining, Duration retryAfter) {

    static RateLimitResult allowed(int remaining) {
        return new RateLimitResult(true, Math.max(remaining, 0), Duration.ZERO);
    }

    static RateLimitResult denied(Duration retryAfter) {
        return new RateLimitResult(false, 0, retryAfter);
    }
}
