package com.aps.vitalpair.auth.infrastructure.web;

import com.aps.vitalpair.auth.application.dto.AuthResult;
import java.util.UUID;

public record TokenResponse(
        String accessToken,
        String refreshToken,
        String tokenType,
        UUID userId) {

    public static TokenResponse from(AuthResult result) {
        return new TokenResponse(result.accessToken(), result.refreshToken(), "Bearer", result.userId());
    }
}
