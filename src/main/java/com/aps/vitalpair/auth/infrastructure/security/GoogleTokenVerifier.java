package com.aps.vitalpair.auth.infrastructure.security;

import java.util.Set;

import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import com.aps.vitalpair.auth.domain.exception.InvalidCredentialsException;
import com.aps.vitalpair.auth.domain.model.GoogleUserInfo;
import com.aps.vitalpair.auth.domain.port.out.GoogleTokenVerifierPort;
import com.aps.vitalpair.config.GoogleOAuthProperties;

/**
 * Verifica o id_token do Google contra as chaves públicas do Google (JWK Set).
 * Valida assinatura e expiração (via Nimbus) e, manualmente, o issuer e a audience (nosso client id).
 *
 * As chaves do Google são buscadas uma vez e cacheadas. Para o primeiro login não pagar o custo
 * dessa busca de rede, ela é pré-carregada no boot ({@link #warmUp()}). Há timeout no fetch.
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
            throw new InvalidCredentialsException("Login com Google não está configurado neste ambiente");
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

    /**
     * Pré-carrega as chaves públicas do Google logo após o boot (em background), para que o
     * primeiro login com Google não pague o custo de buscar o JWK Set. O token é falso de
     * propósito: serve só para disparar (e cachear) a busca das chaves.
     */
    @EventListener(ApplicationReadyEvent.class)
    void warmUp() {
        if (clientId == null || clientId.isBlank()) {
            return;
        }
        try {
            decoder().decode("eyJhbGciOiJSUzI1NiIsImtpZCI6Indhcm11cCJ9.e30.AA");
        } catch (Exception ignored) {
            // esperado: o token é falso. O que importa é que o JWK Set foi buscado e cacheado.
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
                    SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
                    factory.setConnectTimeout(5000);
                    factory.setReadTimeout(5000);
                    decoder = NimbusJwtDecoder.withJwkSetUri(GOOGLE_JWK_SET_URI)
                            .restOperations(new RestTemplate(factory))
                            .build();
                }
            }
        }
        return decoder;
    }
}
