package com.aps.vitapair.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Propriedades de JWT (prefixo {@code vitapair.jwt}).
 *
 * @param secret            chave HMAC; mínimo 32 caracteres (256 bits para HS256)
 * @param accessExpirationMs validade do access token em milissegundos
 * @param refreshExpirationMs validade do refresh token em milissegundos
 */
@ConfigurationProperties(prefix = "vitapair.jwt")
public record JwtProperties(String secret, long accessExpirationMs, long refreshExpirationMs) {
}
