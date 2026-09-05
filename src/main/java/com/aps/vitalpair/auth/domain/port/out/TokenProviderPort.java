package com.aps.vitalpair.auth.domain.port.out;

import java.util.Optional;
import java.util.UUID;

import com.aps.vitalpair.auth.domain.model.TokenPayload;

/** Geração e validação do access token (JWT). */
public interface TokenProviderPort {

    String generateAccessToken(UUID userId, UUID tenantId, String email);

    Optional<TokenPayload> parseAccessToken(String token);
}
