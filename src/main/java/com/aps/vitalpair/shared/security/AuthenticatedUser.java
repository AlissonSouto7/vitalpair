package com.aps.vitalpair.shared.security;

import java.util.UUID;

/**
 * Principal armazenado no SecurityContext após autenticação por JWT.
 * Disponível nos controllers via {@code @AuthenticationPrincipal}.
 */
public record AuthenticatedUser(UUID userId, UUID tenantId, String email, Role role) {}
