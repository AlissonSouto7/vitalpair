package com.aps.vitalpair.mealvision.infrastructure.ai;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * DTOs of Anthropic's {@code POST /v1/messages}, only the fields photo analysis uses.
 *
 * <p>The body uses {@code output_config.format} (json_schema) to force structured output.
 * {@code temperature}, {@code top_p}, {@code top_k} and {@code thinking} are not sent: the
 * {@code claude-opus-4-8} model rejects them with HTTP 400.
 *
 * <p>This class and its records are public because they appear in the signature of
 * {@link AnthropicClient}, a public interface. The dynamic proxy Feign generates lives in
 * another module and cannot reach package-private types: without {@code public} the call fails
 * at runtime with {@code IllegalAccessError}.
 */
public final class AnthropicMessages {

    private AnthropicMessages() {}

    // ===== Request =====

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record Request(
            String model,
            @JsonProperty("max_tokens") int maxTokens,
            String system,
            List<Message> messages,
            @JsonProperty("output_config") OutputConfig outputConfig) {}

    public record Message(String role, List<Content> content) {}

    /** Polymorphic content block: {@code type=image} uses {@code source}; {@code type=text} uses {@code text}. */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record Content(String type, ImageSource source, String text) {

        static Content image(String mediaType, String base64Data) {
            return new Content("image", new ImageSource("base64", mediaType, base64Data), null);
        }

        static Content text(String text) {
            return new Content("text", null, text);
        }
    }

    public record ImageSource(String type, @JsonProperty("media_type") String mediaType, String data) {}

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
