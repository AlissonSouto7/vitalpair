package com.aps.vitapair.auth.infrastructure.security;

import java.util.UUID;

/** Principal armazenado no SecurityContext após autenticação por JWT. */
public record AuthenticatedUser(UUID userId, UUID tenantId, String email) {
}
