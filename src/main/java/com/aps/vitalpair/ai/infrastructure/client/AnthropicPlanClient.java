package com.aps.vitalpair.ai.infrastructure.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

/**
 * Feign client of the Anthropic Messages API (Claude) for plan generation. Deliberately separate
 * from the mealvision feature's client: plans need a longer read timeout, because generating a
 * whole week takes longer than analysing a photo. Headers and timeouts come from
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
