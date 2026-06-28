package com.aps.vitalpair.mealvision.infrastructure.ai;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

/**
 * Cliente Feign da API de Mensagens da Anthropic (Claude). Os headers obrigatórios
 * ({@code x-api-key}, {@code anthropic-version}, {@code content-type}) são injetados pelo
 * {@link AnthropicClientConfig#anthropicHeaders}; os timeouts também vêm de lá.
 */
@FeignClient(
        name = "anthropic",
        url = "${vitalpair.ai.anthropic.base-url}",
        configuration = AnthropicClientConfig.class)
public interface AnthropicClient {

    @PostMapping(value = "/v1/messages", consumes = MediaType.APPLICATION_JSON_VALUE)
    AnthropicMessages.Response createMessage(@RequestBody AnthropicMessages.Request request);
}
