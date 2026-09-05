package com.aps.vitalpair.shared.ratelimit;

import java.time.Duration;

/**
 * How many requests a caller may make to a group of endpoints, and over what window.
 *
 * @param name identifies the bucket in Redis and in the logs
 * @param limit requests allowed per window
 * @param window length of the window
 * @param perUser true to count per authenticated user, false to count per client IP
 */
public record RateLimitPolicy(String name, int limit, Duration window, boolean perUser) {

    /**
     * Credential-guessing defence. Counting per IP rather than per account matters: an
     * attacker spreads attempts across many accounts, so a per-account limit would never
     * trigger while a single IP works through a password list.
     */
    public static RateLimitPolicy perIp(String name, int limit, Duration window) {
        return new RateLimitPolicy(name, limit, window, false);
    }

    /**
     * Cost control for endpoints that call a paid API. Counting per user is what matters
     * here: the concern is one account running up a bill, not one network location.
     */
    public static RateLimitPolicy perUser(String name, int limit, Duration window) {
        return new RateLimitPolicy(name, limit, window, true);
    }
}
