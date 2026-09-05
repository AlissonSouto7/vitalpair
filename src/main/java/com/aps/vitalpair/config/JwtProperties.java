package com.aps.vitalpair.config;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * JWT settings, bound from {@code vitalpair.jwt}.
 *
 * <p>Validated at startup rather than at first use. A missing or too-short secret makes the
 * application refuse to start with a clear message, instead of booting and failing later on
 * the first login, or worse, signing tokens with a value that was never meant for production.
 *
 * @param secret HMAC key, at least 32 characters for HS256's 256 bits
 * @param accessExpirationMs access token lifetime in milliseconds
 * @param refreshExpirationMs refresh token lifetime in milliseconds
 */
@Validated
@ConfigurationProperties(prefix = "vitalpair.jwt")
public record JwtProperties(
        @NotBlank(message = "JWT_SECRET must be set. Generate one with: openssl rand -base64 48")
                @Size(
                        min = 32,
                        message = "JWT_SECRET must be at least 32 characters (256 bits for HS256). "
                                + "Generate one with: openssl rand -base64 48")
                String secret,
        @Positive(message = "vitalpair.jwt.access-expiration-ms must be positive") long accessExpirationMs,
        @Positive(message = "vitalpair.jwt.refresh-expiration-ms must be positive") long refreshExpirationMs) {}
