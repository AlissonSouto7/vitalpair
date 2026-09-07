package com.aps.vitalpair.config;

import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

/**
 * Propriedades da integração com a IA da Anthropic (prefixo {@code vitalpair.ai.anthropic}).
 * Usada pela análise de foto de refeição (feature {@code mealvision}) e pela geração de planos
 * (feature {@code ai}). Quando {@code apiKey} está em branco, a integração fica desligada e a
 * chamada à Anthropic não é feita.
 *
 * <p>The timeouts are configuration rather than constants so a test can exercise the timeout
 * path in seconds. The defaults are the production values: a week of meals is the slowest
 * call in the application and needs the full minute, photo analysis about half that.
 *
 * @param connectTimeout time allowed to open the connection
 * @param planReadTimeout time allowed for a plan-generation response
 * @param photoReadTimeout time allowed for a photo-analysis response
 */
@ConfigurationProperties(prefix = "vitalpair.ai.anthropic")
public record AnthropicProperties(
        String apiKey,
        String baseUrl,
        String model,
        @DefaultValue("5s") Duration connectTimeout,
        @DefaultValue("60s") Duration planReadTimeout,
        @DefaultValue("30s") Duration photoReadTimeout) {

    /** Versão fixa exigida no header {@code anthropic-version}. */
    public static final String ANTHROPIC_VERSION = "2023-06-01";

    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }
}
