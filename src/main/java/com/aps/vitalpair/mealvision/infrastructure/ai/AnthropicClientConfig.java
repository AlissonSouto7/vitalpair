package com.aps.vitalpair.mealvision.infrastructure.ai;

import java.util.concurrent.TimeUnit;

import org.springframework.context.annotation.Bean;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import com.aps.vitalpair.config.AnthropicProperties;

import feign.Request;
import feign.RequestInterceptor;

/**
 * Configuração do {@link AnthropicClient}. Injeta os headers obrigatórios da Anthropic em toda
 * requisição e define os timeouts (a visão é lenta; o valor vem de
 * {@link AnthropicProperties#photoReadTimeout()}). Não é {@code @Configuration} para não virar
 * config global do Feign: ela vale só para o cliente {@code anthropic}.
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
