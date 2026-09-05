package com.aps.vitalpair.shared.ratelimit;

import java.time.Duration;
import java.util.concurrent.TimeUnit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

/**
 * Fixed-window request counter backed by Redis.
 *
 * <p>Redis rather than in-memory state for two reasons: the count survives a restart, so an
 * attacker cannot reset it by waiting for a deploy, and it is shared, so it still holds once
 * more than one instance runs. The counters live beside the refresh tokens already stored
 * there, which is why this needs no new dependency.
 *
 * <p>A fixed window can allow up to twice the limit across a window boundary. A sliding
 * window would not, at the cost of storing every request timestamp. For blunting credential
 * stuffing and capping spend on a paid API, the simpler structure is enough; the note is
 * here so the trade-off is a decision rather than an oversight.
 */
@Component
public class RateLimiter {

    private static final Logger log = LoggerFactory.getLogger(RateLimiter.class);

    private final StringRedisTemplate redis;

    public RateLimiter(StringRedisTemplate redis) {
        this.redis = redis;
    }

    /**
     * Counts one request and reports whether it is allowed.
     *
     * <p>Fails open. If Redis is unreachable the request proceeds: losing rate limiting
     * degrades a defence, while refusing every request during a Redis blip would take the
     * whole application down. The failure is logged so it cannot pass unnoticed.
     *
     * @param identity the caller, already resolved to a user id or a client IP
     * @return the outcome, including how long to wait when the limit is reached
     */
    public RateLimitResult check(RateLimitPolicy policy, String identity) {
        String key = "ratelimit:%s:%s".formatted(policy.name(), identity);

        try {
            Long count = redis.opsForValue().increment(key);
            if (count == null) {
                return RateLimitResult.allowed(policy.limit());
            }

            // Only the first request of a window sets the expiry. Refreshing it on every
            // request would keep pushing the reset further away, so a caller who keeps
            // trying would never get their allowance back.
            if (count == 1L) {
                redis.expire(key, policy.window());
            }

            if (count > policy.limit()) {
                Long ttl = redis.getExpire(key, TimeUnit.SECONDS);
                Duration retryAfter = Duration.ofSeconds(
                        ttl != null && ttl > 0 ? ttl : policy.window().toSeconds());
                return RateLimitResult.denied(retryAfter);
            }

            return RateLimitResult.allowed(policy.limit() - count.intValue());
        } catch (RuntimeException ex) {
            log.error("Rate limit check failed for policy {}; allowing the request", policy.name(), ex);
            return RateLimitResult.allowed(policy.limit());
        }
    }
}
