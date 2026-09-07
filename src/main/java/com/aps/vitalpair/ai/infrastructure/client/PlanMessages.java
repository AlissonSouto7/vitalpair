package com.aps.vitalpair.ai.infrastructure.client;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * DTOs of Anthropic's {@code POST /v1/messages} for plan generation (text only, no image).
 *
 * <p>The body uses {@code output_config.format} (json_schema) to force structured output.
 * {@code temperature}, {@code top_p}, {@code top_k} and {@code thinking} are not sent: the
 * {@code claude-opus-4-8} model rejects them with HTTP 400.
 *
 * <p>This class and its {@code Request} and {@code Response} records are public because they
 * appear in the signature of {@link AnthropicPlanClient}, a public interface. The dynamic proxy
 * Feign generates lives in another module and cannot reach package-private types: without
 * {@code public} the call fails at runtime with {@code IllegalAccessError}.
 */
public final class PlanMessages {

    private PlanMessages() {}

    // ===== Request =====

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record Request(
            String model,
            @JsonProperty("max_tokens") int maxTokens,
            String system,
            List<Message> messages,
            @JsonProperty("output_config") OutputConfig outputConfig) {}

    public record Message(String role, List<Content> content) {}

    public record Content(String type, String text) {

        static Content text(String text) {
            return new Content("text", text);
        }
    }

    public record OutputConfig(Format format) {}

    public record Format(String type, Object schema) {

        static Format jsonSchema(Object schema) {
            return new Format("json_schema", schema);
        }
    }

    // ===== Response =====

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Response(List<Block> content, @JsonProperty("stop_reason") String stopReason) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Block(String type, String text) {}
}
