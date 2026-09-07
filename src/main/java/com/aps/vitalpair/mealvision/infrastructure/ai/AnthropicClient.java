package com.aps.vitalpair.mealvision.infrastructure.ai;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

/**
 * Feign client of the Anthropic Messages API (Claude). The required headers ({@code x-api-key},
 * {@code anthropic-version}, {@code content-type}) are injected by
 * {@link AnthropicClientConfig#anthropicHeaders}; the timeouts come from there too.
 */
@FeignClient(
        name = "anthropic",
        url = "${vitalpair.ai.anthropic.base-url}",
        configuration = AnthropicClientConfig.class)
public interface AnthropicClient {

    @PostMapping(value = "/v1/messages", consumes = MediaType.APPLICATION_JSON_VALUE)
    AnthropicMessages.Response createMessage(@RequestBody AnthropicMessages.Request request);
}
