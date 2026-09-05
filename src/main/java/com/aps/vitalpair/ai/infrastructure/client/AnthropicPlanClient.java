package com.aps.vitalpair.ai.infrastructure.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

/**
 * Cliente Feign da API de Mensagens da Anthropic (Claude) para geração de planos. É um cliente
 * separado do da feature mealvision de propósito: os planos precisam de timeout de leitura maior
 * (gerar a semana inteira demora mais que analisar uma foto). Headers e timeouts vêm do
 * {@link AnthropicPlanClientConfig}.
 */
@FeignClient(
        name = "anthropic-plans",
        url = "${vitalpair.ai.anthropic.base-url}",
        configuration = AnthropicPlanClientConfig.class)
public interface AnthropicPlanClient {

    @PostMapping(value = "/v1/messages", consumes = MediaType.APPLICATION_JSON_VALUE)
    PlanMessages.Response createMessage(@RequestBody PlanMessages.Request request);
}
