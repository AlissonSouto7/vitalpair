package com.aps.vitalpair.auth.application.dto;

import java.util.UUID;

/** The outcome of an authentication use case. */
public record AuthResult(String accessToken, String refreshToken, UUID userId) {}
