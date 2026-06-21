package com.aps.vitapair.auth.domain.port.out;

import java.util.Optional;
import java.util.UUID;

/**
 * Armazenamento de refresh tokens (Redis), permitindo revogação imediata (logout real).
 */
public interface RefreshTokenStorePort {

    void save(String refreshToken, UUID userId, long ttlMs);

    Optional<UUID> findUser(String refreshToken);

    void revoke(String refreshToken);
}
