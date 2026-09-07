package com.aps.vitalpair.shared.security;

import java.util.UUID;

/**
 * The principal stored in the SecurityContext after JWT authentication. Available to
 * controllers through {@code @AuthenticationPrincipal}.
 */
public record AuthenticatedUser(UUID userId, UUID tenantId, String email, Role role) {}
