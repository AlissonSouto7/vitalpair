package com.aps.vitalpair.auth.domain.port.out;

import java.util.Optional;
import java.util.UUID;

import com.aps.vitalpair.auth.domain.model.TokenPayload;
import com.aps.vitalpair.shared.security.Role;

/** Geração e validação do access token (JWT). */
public interface TokenProviderPort {

    String generateAccessToken(UUID userId, UUID tenantId, String email, Role role);

    Optional<TokenPayload> parseAccessToken(String token);
}
