package com.aps.vitalpair.auth.domain.port.out;

import java.util.Optional;
import java.util.UUID;

/** Stores opaque e-mail verification tokens (token to userId, with a TTL). Implemented in Redis. */
public interface EmailVerificationTokenStorePort {

    void save(String token, UUID userId, long ttlMs);

    Optional<UUID> findUser(String token);

    void revoke(String token);
}
