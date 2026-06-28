package com.aps.vitalpair.auth.domain.port.out;

import java.util.Optional;
import java.util.UUID;

/**
 * Armazena tokens opacos de redefinição de senha (token → userId, com TTL curto).
 * Implementado no Redis, à semelhança de {@link RefreshTokenStorePort}.
 */
public interface PasswordResetTokenStorePort {

    void save(String token, UUID userId, long ttlMs);

    Optional<UUID> findUser(String token);

    void revoke(String token);
}
