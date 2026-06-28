package com.aps.vitalpair.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Propriedades da integração com a IA da Anthropic (prefixo {@code vitalpair.ai.anthropic}).
 * Usada pela análise de foto de refeição (feature {@code mealvision}). Quando {@code apiKey}
 * está em branco, a integração fica desligada e a chamada à Anthropic não é feita.
 */
@ConfigurationProperties(prefix = "vitalpair.ai.anthropic")
public record AnthropicProperties(String apiKey, String baseUrl, String model) {

    /** Versão fixa exigida no header {@code anthropic-version}. */
    public static final String ANTHROPIC_VERSION = "2023-06-01";

    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }
}
