package com.aps.vitalpair.mealvision.infrastructure.ai;

import java.util.concurrent.TimeUnit;

import org.springframework.context.annotation.Bean;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import com.aps.vitalpair.config.AnthropicProperties;

import feign.Request;
import feign.RequestInterceptor;

/**
 * Configuration of {@link AnthropicClient}. Injects the headers Anthropic requires on every
 * request and sets the timeouts (vision is slow; the value comes from
 * {@link AnthropicProperties#photoReadTimeout()}). Not a {@code @Configuration} so it does not
 * become global Feign configuration: it applies to the {@code anthropic} client only.
 */
public class AnthropicClientConfig {

    @Bean
    public RequestInterceptor anthropicHeaders(AnthropicProperties properties) {
        return template -> {
            template.header("x-api-key", properties.apiKey());
            template.header("anthropic-version", AnthropicProperties.ANTHROPIC_VERSION);
            template.header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE);
        };
    }

    @Bean
    public Request.Options anthropicTimeouts(AnthropicProperties properties) {
        return new Request.Options(
                properties.connectTimeout().toMillis(),
                TimeUnit.MILLISECONDS,
                properties.photoReadTimeout().toMillis(),
                TimeUnit.MILLISECONDS,
                true);
    }
}
