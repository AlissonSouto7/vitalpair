package com.aps.vitapair.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Propriedades do login com Google (prefixo {@code vitapair.oauth2.google}).
 *
 * @param clientId o OAuth 2.0 Client ID do Google Cloud Console; usado para validar a audience do id_token
 */
@ConfigurationProperties(prefix = "vitapair.oauth2.google")
public record GoogleOAuthProperties(String clientId) {
}
