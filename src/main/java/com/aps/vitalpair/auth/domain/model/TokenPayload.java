package com.aps.vitalpair.auth.domain.model;

import java.util.UUID;

import com.aps.vitalpair.shared.security.Role;

/** Data carried by a valid access token. */
public record TokenPayload(UUID userId, UUID tenantId, String email, Role role) {}
