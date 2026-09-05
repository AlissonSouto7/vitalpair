package com.aps.vitalpair.auth.infrastructure.persistence;

import java.time.Duration;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import com.aps.vitalpair.auth.domain.port.out.PasswordResetTokenStorePort;

/** Implementa {@link PasswordResetTokenStorePort} no Redis (chave {@code pwdreset:<token>} → userId, com TTL). */
@Component
public class RedisPasswordResetTokenStore implements PasswordResetTokenStorePort {

    private static final String KEY_PREFIX = "pwdreset:";

    private final StringRedisTemplate redis;

    public RedisPasswordResetTokenStore(StringRedisTemplate redis) {
        this.redis = redis;
    }

    @Override
    public void save(String token, UUID userId, long ttlMs) {
        redis.opsForValue().set(key(token), userId.toString(), Duration.ofMillis(ttlMs));
    }

    @Override
    public Optional<UUID> findUser(String token) {
        return Optional.ofNullable(redis.opsForValue().get(key(token))).map(UUID::fromString);
    }

    @Override
    public void revoke(String token) {
        redis.delete(key(token));
    }

    private String key(String token) {
        return KEY_PREFIX + token;
    }
}
