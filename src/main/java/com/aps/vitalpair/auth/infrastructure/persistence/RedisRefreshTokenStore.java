package com.aps.vitalpair.auth.infrastructure.persistence;

import com.aps.vitalpair.auth.domain.port.out.RefreshTokenStorePort;
import java.time.Duration;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

/** Implementa {@link RefreshTokenStorePort} no Redis (chave {@code refresh:<token>} → userId, com TTL). */
@Component
public class RedisRefreshTokenStore implements RefreshTokenStorePort {

    private static final String KEY_PREFIX = "refresh:";

    private final StringRedisTemplate redis;

    public RedisRefreshTokenStore(StringRedisTemplate redis) {
        this.redis = redis;
    }

    @Override
    public void save(String refreshToken, UUID userId, long ttlMs) {
        redis.opsForValue().set(key(refreshToken), userId.toString(), Duration.ofMillis(ttlMs));
    }

    @Override
    public Optional<UUID> findUser(String refreshToken) {
        return Optional.ofNullable(redis.opsForValue().get(key(refreshToken))).map(UUID::fromString);
    }

    @Override
    public void revoke(String refreshToken) {
        redis.delete(key(refreshToken));
    }

    private String key(String refreshToken) {
        return KEY_PREFIX + refreshToken;
    }
}
