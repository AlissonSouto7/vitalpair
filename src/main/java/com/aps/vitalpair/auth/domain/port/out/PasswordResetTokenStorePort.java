package com.aps.vitalpair.auth.domain.port.out;

import java.util.Optional;
import java.util.UUID;

/**
 * Stores opaque password reset tokens (token to userId, with a short TTL). Implemented in
 * Redis, like {@link RefreshTokenStorePort}.
 */
public interface PasswordResetTokenStorePort {

    void save(String token, UUID userId, long ttlMs);

    Optional<UUID> findUser(String token);

    void revoke(String token);
}
