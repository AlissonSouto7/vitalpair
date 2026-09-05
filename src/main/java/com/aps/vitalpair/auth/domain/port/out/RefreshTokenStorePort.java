package com.aps.vitalpair.auth.domain.port.out;

import java.util.Optional;
import java.util.UUID;

/**
 * Storage for refresh tokens, so a logout revokes immediately instead of waiting for the
 * token to expire.
 *
 * <p>Tokens are grouped into families. Every rotation issues a new token in the same family
 * as the one it replaces, which is what makes theft detectable: a token is meant to be used
 * once, so if a spent token comes back, either the legitimate holder or an attacker is
 * replaying it. There is no way to tell which, and no need to: revoking the whole family
 * ends both sessions and forces a real login.
 */
public interface RefreshTokenStorePort {

    /**
     * Stores a token as the active one for its family.
     *
     * @param familyId groups every token descended from one login
     */
    void save(String refreshToken, UUID userId, UUID familyId, long ttlMs);

    /** Returns the owner and family of an active token, or empty if it is unknown or spent. */
    Optional<StoredRefreshToken> find(String refreshToken);

    /**
     * Marks a token as spent and records which family it belonged to, so a later replay can
     * be recognised rather than looking like an unknown token.
     */
    void markSpent(String refreshToken, UUID familyId, long ttlMs);

    /** Returns the family of a spent token, or empty if it was never issued. */
    Optional<UUID> findSpentFamily(String refreshToken);

    /**
     * Revokes every token in a family. Called on logout, and on replay of a spent token,
     * where the safe assumption is that one of the two holders is an attacker.
     */
    void revokeFamily(UUID familyId);

    /** Owner and family of a stored token. */
    record StoredRefreshToken(UUID userId, UUID familyId) {}
}
