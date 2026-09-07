package com.aps.vitalpair.ai.infrastructure.client;

import java.util.concurrent.TimeUnit;

import org.springframework.context.annotation.Bean;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import com.aps.vitalpair.config.AnthropicProperties;

import feign.Request;
import feign.RequestInterceptor;

/**
 * Configuration of {@link AnthropicPlanClient}. Injects the headers Anthropic requires and sets
 * the timeouts (generating a week of plan is the slowest call in the application; the value
 * comes from {@link AnthropicProperties#planReadTimeout()}). Not a {@code @Configuration} so it
 * does not become global Feign configuration: it applies to the {@code anthropic-plans} client
 * only.
 */
public class AnthropicPlanClientConfig {

    @Bean
    public RequestInterceptor anthropicPlanHeaders(AnthropicProperties properties) {
        return template -> {
            template.header("x-api-key", properties.apiKey());
            template.header("anthropic-version", AnthropicProperties.ANTHROPIC_VERSION);
            template.header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE);
        };
    }

    @Bean
    public Request.Options anthropicPlanTimeouts(AnthropicProperties properties) {
        return new Request.Options(
                properties.connectTimeout().toMillis(),
                TimeUnit.MILLISECONDS,
                properties.planReadTimeout().toMillis(),
                TimeUnit.MILLISECONDS,
                true);
    }
}
