package com.aps.vitalpair.auth.domain.port.out;

import java.util.Optional;
import java.util.UUID;

/** Armazena tokens opacos de verificação de e-mail (token → userId, com TTL). Implementado no Redis. */
public interface EmailVerificationTokenStorePort {

    void save(String token, UUID userId, long ttlMs);

    Optional<UUID> findUser(String token);

    void revoke(String token);
}
