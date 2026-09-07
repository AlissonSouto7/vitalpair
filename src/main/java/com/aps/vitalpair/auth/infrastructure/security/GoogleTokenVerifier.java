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
 * Verifies a Google id_token against Google's public keys (the JWK Set). Signature and expiry
 * are checked by Nimbus; issuer and audience (our client id) are checked by hand.
 *
 * <p>Google's keys are fetched once and cached. So the first login does not pay for that
 * network fetch, it is preloaded at boot ({@link #warmUp()}). The fetch has a timeout.
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
     * Preloads Google's public keys right after boot, in the background, so the first Google
     * login does not pay for fetching the JWK Set. The token is deliberately fake: it exists only
     * to trigger, and cache, the key fetch.
     */
    @EventListener(ApplicationReadyEvent.class)
    void warmUp() {
        if (clientId == null || clientId.isBlank()) {
            return;
        }
        try {
            decoder().decode("eyJhbGciOiJSUzI1NiIsImtpZCI6Indhcm11cCJ9.e30.AA");
        } catch (Exception ignored) {
            // expected: the token is fake. What matters is that the JWK Set was fetched and cached.
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
