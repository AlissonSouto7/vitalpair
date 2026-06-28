package com.aps.vitalpair.auth.domain.port.out;

import com.aps.vitalpair.auth.domain.model.TokenPayload;
import java.util.Optional;
import java.util.UUID;

/** Geração e validação do access token (JWT). */
public interface TokenProviderPort {

    String generateAccessToken(UUID userId, UUID tenantId, String email);

    Optional<TokenPayload> parseAccessToken(String token);
}
