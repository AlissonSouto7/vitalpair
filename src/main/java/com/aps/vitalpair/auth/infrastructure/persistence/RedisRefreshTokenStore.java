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
 *   <li>{@code refresh:user:<userId>} as a set of every family the person has, so their
 *       sessions can be ended without holding one of their tokens
 * </ul>
 */
@Component
public class RedisRefreshTokenStore implements RefreshTokenStorePort {

    private static final String ACTIVE_PREFIX = "refresh:";
    private static final String SPENT_PREFIX = "refresh:spent:";
    private static final String FAMILY_PREFIX = "refresh:family:";
    private static final String USER_PREFIX = "refresh:user:";

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

        // Rotation re-adds the same family, which a set makes a no-op, so this holds one
        // entry per login rather than one per token. The expiry is refreshed on every save,
        // so an account in daily use never loses its index; the key exists only to be read
        // by revokeAllForUser and is harmless if it outlives the tokens by a day.
        redis.opsForSet().add(userKey(userId), familyId.toString());
        redis.expire(userKey(userId), ttl.plusDays(1));
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
        UUID ownerId = null;
        if (tokens != null) {
            for (String token : tokens) {
                if (ownerId == null) {
                    // Read before the delete: the owner is only recorded on the token, and
                    // this is the one chance to learn whose index to tidy.
                    ownerId = find(token).map(StoredRefreshToken::userId).orElse(null);
                }
                redis.delete(activeKey(token));
                redis.delete(spentKey(token));
            }
        }
        redis.delete(familyKey(familyId));
        if (ownerId != null) {
            // Without this, logging out and back in repeatedly grows the index with families
            // that no longer exist. Revoking would still work, it would just walk over dead
            // entries, and the set would keep a person's whole login history for a month.
            redis.opsForSet().remove(userKey(ownerId), familyId.toString());
        }
    }

    @Override
    public void revokeAllForUser(UUID userId) {
        Set<String> families = redis.opsForSet().members(userKey(userId));
        if (families != null) {
            for (String family : families) {
                revokeFamily(UUID.fromString(family));
            }
        }
        redis.delete(userKey(userId));
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

    private String userKey(UUID userId) {
        return USER_PREFIX + userId;
    }
}
