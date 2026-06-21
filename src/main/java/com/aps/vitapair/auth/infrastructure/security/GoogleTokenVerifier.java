package com.aps.vitapair.auth.infrastructure.security;

import com.aps.vitapair.auth.domain.exception.InvalidCredentialsException;
import com.aps.vitapair.auth.domain.model.GoogleUserInfo;
import com.aps.vitapair.auth.domain.port.out.GoogleTokenVerifierPort;
import com.aps.vitapair.config.GoogleOAuthProperties;
import com.aps.vitapair.shared.exception.BusinessRuleException;
import java.util.Set;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.stereotype.Component;

/**
 * Verifica o id_token do Google contra as chaves públicas do Google (JWK Set).
 * Valida assinatura e expiração (via Nimbus) e, manualmente, o issuer e a audience (nosso client id).
 */
@Component
public class GoogleTokenVerifier implements GoogleTokenVerifierPort {

    private static final String GOOGLE_JWK_SET_URI = "https://www.googleapis.com/oauth2/v3/certs";
    private static final Set<String> VALID_ISSUERS = Set.of("https://accounts.google.com", "accounts.google.com");

    private final String clientId;
    private volatile NimbusJwtDecoder decoder;

    public GoogleTokenVerifier(GoogleOAuthProperties properties) {
        this.clientId = properties.clientId();
    }

    @Override
    public GoogleUserInfo verify(String idToken) {
        if (clientId == null || clientId.isBlank()) {
            throw new BusinessRuleException("Login com Google não está configurado neste ambiente");
        }
        try {
            Jwt jwt = decoder().decode(idToken);
            validateIssuer(jwt);
            validateAudience(jwt);
            return new GoogleUserInfo(
                    jwt.getClaimAsString("email"),
                    jwt.getClaimAsString("name"),
                    Boolean.TRUE.equals(jwt.getClaim("email_verified")));
        } catch (JwtException ex) {
            throw new InvalidCredentialsException("Token do Google inválido");
        }
    }

    private void validateIssuer(Jwt jwt) {
        String issuer = jwt.getIssuer() == null ? null : jwt.getIssuer().toString();
        if (!VALID_ISSUERS.contains(issuer)) {
            throw new InvalidCredentialsException("Issuer do token Google inválido");
        }
    }

    private void validateAudience(Jwt jwt) {
        if (jwt.getAudience() == null || !jwt.getAudience().contains(clientId)) {
            throw new InvalidCredentialsException("Audience do token Google inválida");
        }
    }

    private NimbusJwtDecoder decoder() {
        if (decoder == null) {
            synchronized (this) {
                if (decoder == null) {
                    decoder = NimbusJwtDecoder.withJwkSetUri(GOOGLE_JWK_SET_URI).build();
                }
            }
        }
        return decoder;
    }
}
