package com.aps.vitapair.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Propriedades da integração com a Open Food Facts (prefixo {@code vitapair.openfoodfacts}).
 * O User-Agent é obrigatório pela API. A busca por nome usa a Search-a-licious
 * ({@code searchUrl}), mais estável para uso programático que o endpoint legado;
 * a busca por código de barras usa a API principal ({@code baseUrl}).
 */
@ConfigurationProperties(prefix = "vitapair.openfoodfacts")
public record OpenFoodFactsProperties(String baseUrl, String searchUrl, String userAgent) {
}
