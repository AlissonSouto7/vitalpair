package com.aps.vitalpair.config;

import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

/**
 * Properties of the Anthropic integration (prefix {@code vitalpair.ai.anthropic}). Used by meal
 * photo analysis (feature {@code mealvision}) and by plan generation (feature {@code ai}). When
 * {@code apiKey} is blank the integration is off and Anthropic is never called.
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

    /** The fixed version required in the {@code anthropic-version} header. */
    public static final String ANTHROPIC_VERSION = "2023-06-01";

    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }
}
