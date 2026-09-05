package com.aps.vitalpair.auth.infrastructure.security;

import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Optional;
import java.util.UUID;

import javax.crypto.SecretKey;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import com.aps.vitalpair.auth.domain.model.TokenPayload;
import com.aps.vitalpair.auth.domain.port.out.TokenProviderPort;
import com.aps.vitalpair.config.JwtProperties;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

/** Implementação de {@link TokenProviderPort} com JWT assinado em HS256 (jjwt). */
@Component
public class JwtTokenProvider implements TokenProviderPort {

    private static final Logger log = LoggerFactory.getLogger(JwtTokenProvider.class);
    private static final String CLAIM_TENANT = "tenantId";
    private static final String CLAIM_EMAIL = "email";

    private final SecretKey key;
    private final long accessExpirationMs;

    public JwtTokenProvider(JwtProperties properties) {
        if (properties.secret() == null || properties.secret().length() < 32) {
            throw new IllegalStateException("vitalpair.jwt.secret deve ter no mínimo 32 caracteres (256 bits)");
        }
        this.key = Keys.hmacShaKeyFor(properties.secret().getBytes(StandardCharsets.UTF_8));
        this.accessExpirationMs = properties.accessExpirationMs();
    }

    @Override
    public String generateAccessToken(UUID userId, UUID tenantId, String email) {
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .subject(userId.toString())
                .claim(CLAIM_TENANT, tenantId.toString())
                .claim(CLAIM_EMAIL, email)
                .issuedAt(new Date(now))
                .expiration(new Date(now + accessExpirationMs))
                .signWith(key)
                .compact();
    }

    @Override
    public Optional<TokenPayload> parseAccessToken(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            return Optional.of(new TokenPayload(
                    UUID.fromString(claims.getSubject()),
                    UUID.fromString(claims.get(CLAIM_TENANT, String.class)),
                    claims.get(CLAIM_EMAIL, String.class)));
        } catch (Exception ex) {
            log.debug("Access token inválido: {}", ex.getMessage());
            return Optional.empty();
        }
    }
}
