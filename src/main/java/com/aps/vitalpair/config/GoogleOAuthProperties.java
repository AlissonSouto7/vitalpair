package com.aps.vitalpair.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Propriedades do login com Google (prefixo {@code vitalpair.oauth2.google}).
 *
 * @param clientId o OAuth 2.0 Client ID do Google Cloud Console; usado para validar a audience do id_token
 */
@ConfigurationProperties(prefix = "vitalpair.oauth2.google")
public record GoogleOAuthProperties(String clientId) {}
