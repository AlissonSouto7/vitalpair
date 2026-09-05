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
import com.aps.vitalpair.shared.security.Role;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

/** Implementação de {@link TokenProviderPort} com JWT assinado em HS256 (jjwt). */
@Component
public class JwtTokenProvider implements TokenProviderPort {

    private static final Logger log = LoggerFactory.getLogger(JwtTokenProvider.class);
    private static final String CLAIM_TENANT = "tenantId";
    private static final String CLAIM_EMAIL = "email";
    private static final String CLAIM_ROLE = "role";

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
    public String generateAccessToken(UUID userId, UUID tenantId, String email, Role role) {
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .subject(userId.toString())
                .claim(CLAIM_TENANT, tenantId.toString())
                .claim(CLAIM_EMAIL, email)
                .claim(CLAIM_ROLE, role.name())
                .issuedAt(new Date(now))
                .expiration(new Date(now + accessExpirationMs))
                .signWith(key)
                .compact();
    }

    private static Role parseRole(String claim) {
        if (claim == null) {
            return Role.USER;
        }
        try {
            return Role.valueOf(claim);
        } catch (IllegalArgumentException ex) {
            log.warn("Unknown role claim '{}' in token; treating as USER", claim);
            return Role.USER;
        }
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
                    claims.get(CLAIM_EMAIL, String.class),
                    // Tokens issued before roles existed carry no claim. Treating a missing
                    // claim as USER lets them keep working until they expire, instead of
                    // logging everyone out on deploy. USER is the safe default: the worst
                    // case is an admin briefly losing admin, never the reverse.
                    parseRole(claims.get(CLAIM_ROLE, String.class))));
        } catch (Exception ex) {
            log.debug("Access token inválido: {}", ex.getMessage());
            return Optional.empty();
        }
    }
}
