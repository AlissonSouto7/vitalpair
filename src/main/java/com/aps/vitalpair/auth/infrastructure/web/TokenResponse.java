package com.aps.vitalpair.auth.infrastructure.web;

import java.util.UUID;

import com.aps.vitalpair.auth.application.dto.AuthResult;

/**
 * What a successful authentication returns to the client.
 *
 * <p>The refresh token is deliberately absent. It travels in an HttpOnly cookie instead, so
 * client script never touches it and an XSS cannot steal a credential that renews itself for
 * thirty days. The access token stays in the body because the client has to attach it to
 * every request, and it expires in fifteen minutes.
 */
public record TokenResponse(String accessToken, String tokenType, UUID userId) {

    public static TokenResponse from(AuthResult result) {
        return new TokenResponse(result.accessToken(), "Bearer", result.userId());
    }
}
