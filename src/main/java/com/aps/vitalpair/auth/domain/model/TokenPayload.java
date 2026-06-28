package com.aps.vitalpair.auth.domain.model;

import java.util.UUID;

/** Dados extraídos de um access token válido. */
public record TokenPayload(UUID userId, UUID tenantId, String email) {
}
