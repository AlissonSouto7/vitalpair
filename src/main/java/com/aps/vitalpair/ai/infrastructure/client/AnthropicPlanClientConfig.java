package com.aps.vitalpair.ai.infrastructure.client;

import java.util.concurrent.TimeUnit;

import org.springframework.context.annotation.Bean;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import com.aps.vitalpair.config.AnthropicProperties;

import feign.Request;
import feign.RequestInterceptor;

/**
 * Configuração do {@link AnthropicPlanClient}. Injeta os headers obrigatórios da Anthropic e
 * define timeout de leitura de 60s (gerar uma semana de plano é a chamada mais lenta do app).
 * Não é {@code @Configuration} para não virar config global do Feign: vale só para o cliente
 * {@code anthropic-plans}.
 */
public class AnthropicPlanClientConfig {

    private static final int CONNECT_TIMEOUT_SECONDS = 5;
    private static final int READ_TIMEOUT_SECONDS = 60;

    @Bean
    public RequestInterceptor anthropicPlanHeaders(AnthropicProperties properties) {
        return template -> {
            template.header("x-api-key", properties.apiKey());
            template.header("anthropic-version", AnthropicProperties.ANTHROPIC_VERSION);
            template.header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE);
        };
    }

    @Bean
    public Request.Options anthropicPlanTimeouts() {
        return new Request.Options(
                CONNECT_TIMEOUT_SECONDS, TimeUnit.SECONDS, READ_TIMEOUT_SECONDS, TimeUnit.SECONDS, true);
    }
}
