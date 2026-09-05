package com.aps.vitalpair.auth.infrastructure.persistence;

import java.time.Duration;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import com.aps.vitalpair.auth.domain.port.out.RefreshTokenStorePort;

/**
 * Redis-backed refresh tokens with family tracking.
 *
 * <p>Three key shapes, all expiring on their own so nothing has to be cleaned up:
 *
 * <ul>
 *   <li>{@code refresh:<token>} to {@code userId:familyId} for tokens that are still usable
 *   <li>{@code refresh:spent:<token>} to {@code familyId} for tokens already exchanged,
 *       kept so a replay is recognised as theft rather than dismissed as unknown
 *   <li>{@code refresh:family:<familyId>} as a set of every token in the family, so one
 *       replay can revoke all of them
 * </ul>
 */
@Component
public class RedisRefreshTokenStore implements RefreshTokenStorePort {

    private static final String ACTIVE_PREFIX = "refresh:";
    private static final String SPENT_PREFIX = "refresh:spent:";
    private static final String FAMILY_PREFIX = "refresh:family:";

    private final StringRedisTemplate redis;

    public RedisRefreshTokenStore(StringRedisTemplate redis) {
        this.redis = redis;
    }

    @Override
    public void save(String refreshToken, UUID userId, UUID familyId, long ttlMs) {
        Duration ttl = Duration.ofMillis(ttlMs);
        redis.opsForValue().set(activeKey(refreshToken), userId + ":" + familyId, ttl);
        redis.opsForSet().add(familyKey(familyId), refreshToken);
        // The family index must outlive its members, otherwise a replay arriving near the
        // end of the window would find nothing left to revoke.
        redis.expire(familyKey(familyId), ttl.plusDays(1));
    }

    @Override
    public Optional<StoredRefreshToken> find(String refreshToken) {
        String value = redis.opsForValue().get(activeKey(refreshToken));
        if (value == null) {
            return Optional.empty();
        }
        String[] parts = value.split(":", 2);
        if (parts.length != 2) {
            return Optional.empty();
        }
        return Optional.of(new StoredRefreshToken(UUID.fromString(parts[0]), UUID.fromString(parts[1])));
    }

    @Override
    public void markSpent(String refreshToken, UUID familyId, long ttlMs) {
        redis.delete(activeKey(refreshToken));
        // Kept for the full token lifetime: a replay is only meaningful while the stolen
        // token would still have been valid.
        redis.opsForValue().set(spentKey(refreshToken), familyId.toString(), Duration.ofMillis(ttlMs));
    }

    @Override
    public Optional<UUID> findSpentFamily(String refreshToken) {
        return Optional.ofNullable(redis.opsForValue().get(spentKey(refreshToken)))
                .map(UUID::fromString);
    }

    @Override
    public void revokeFamily(UUID familyId) {
        Set<String> tokens = redis.opsForSet().members(familyKey(familyId));
        if (tokens != null) {
            for (String token : tokens) {
                redis.delete(activeKey(token));
                redis.delete(spentKey(token));
            }
        }
        redis.delete(familyKey(familyId));
    }

    private String activeKey(String refreshToken) {
        return ACTIVE_PREFIX + refreshToken;
    }

    private String spentKey(String refreshToken) {
        return SPENT_PREFIX + refreshToken;
    }

    private String familyKey(UUID familyId) {
        return FAMILY_PREFIX + familyId;
    }
}
