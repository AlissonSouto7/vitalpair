package com.aps.vitalpair.shared.ratelimit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Duration;
import java.util.concurrent.TimeUnit;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.RedisConnectionFailureException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

@ExtendWith(MockitoExtension.class)
class RateLimiterTest {

    private static final RateLimitPolicy POLICY = RateLimitPolicy.perIp("login", 3, Duration.ofMinutes(1));
    private static final String IDENTITY = "ip:203.0.113.7";

    @Mock
    private StringRedisTemplate redis;

    @Mock
    private ValueOperations<String, String> valueOps;

    private RateLimiter limiter;

    @BeforeEach
    void setUp() {
        limiter = new RateLimiter(redis);
    }

    @Test
    void allowsRequestsUpToTheLimit() {
        when(redis.opsForValue()).thenReturn(valueOps);
        when(valueOps.increment(anyString())).thenReturn(3L);

        RateLimitResult result = limiter.check(POLICY, IDENTITY);

        assertThat(result.allowed())
                .as("the third of three allowed requests must pass")
                .isTrue();
        assertThat(result.remaining()).isZero();
    }

    @Test
    void deniesTheRequestAfterTheLimit() {
        when(redis.opsForValue()).thenReturn(valueOps);
        when(valueOps.increment(anyString())).thenReturn(4L);
        when(redis.getExpire(anyString(), any(TimeUnit.class))).thenReturn(42L);

        RateLimitResult result = limiter.check(POLICY, IDENTITY);

        assertThat(result.allowed()).isFalse();
        assertThat(result.retryAfter())
                .as("Retry-After must reflect the real time left, not the whole window")
                .isEqualTo(Duration.ofSeconds(42));
    }

    @Test
    void setsTheExpiryOnlyOnTheFirstRequestOfAWindow() {
        when(redis.opsForValue()).thenReturn(valueOps);
        when(valueOps.increment(anyString())).thenReturn(1L);

        limiter.check(POLICY, IDENTITY);

        verify(redis).expire(anyString(), any(Duration.class));
    }

    @Test
    void doesNotRefreshTheExpiryOnLaterRequests() {
        when(redis.opsForValue()).thenReturn(valueOps);
        when(valueOps.increment(anyString())).thenReturn(2L);

        limiter.check(POLICY, IDENTITY);

        // Refreshing here would push the reset further away every time a blocked caller
        // retried, so their allowance would never come back.
        verify(redis, never()).expire(anyString(), any(Duration.class));
    }

    @Test
    void allowsTheRequestWhenRedisIsUnreachable() {
        when(redis.opsForValue()).thenThrow(new RedisConnectionFailureException("down"));

        RateLimitResult result = limiter.check(POLICY, IDENTITY);

        assertThat(result.allowed())
                .as("failing closed would turn a Redis blip into a full outage")
                .isTrue();
    }

    @Test
    void countsEachPolicyAndIdentitySeparately() {
        when(redis.opsForValue()).thenReturn(valueOps);
        when(valueOps.increment(anyString())).thenReturn(1L);

        limiter.check(POLICY, IDENTITY);
        limiter.check(RateLimitPolicy.perUser("mealplan", 5, Duration.ofHours(1)), "user:abc");

        // One caller hitting login must not consume another caller's plan-generation
        // allowance, nor their own allowance on a different endpoint.
        verify(valueOps).increment("ratelimit:login:ip:203.0.113.7");
        verify(valueOps).increment("ratelimit:mealplan:user:abc");
    }

    @Test
    void toleratesRedisReturningNoCount() {
        when(redis.opsForValue()).thenReturn(valueOps);
        when(valueOps.increment(anyString())).thenReturn(null);

        assertThat(limiter.check(POLICY, IDENTITY).allowed()).isTrue();
        verify(redis, never()).expire(anyString(), any(Duration.class));
    }

    @Test
    void fallsBackToTheFullWindowWhenTheKeyHasNoExpiry() {
        when(redis.opsForValue()).thenReturn(valueOps);
        when(valueOps.increment(anyString())).thenReturn(9L);
        when(redis.getExpire(anyString(), any(TimeUnit.class))).thenReturn(-1L);

        RateLimitResult result = limiter.check(POLICY, IDENTITY);

        assertThat(result.retryAfter())
                .as("a missing TTL must not produce a Retry-After of zero, which invites an immediate retry")
                .isEqualTo(POLICY.window());
    }
}
