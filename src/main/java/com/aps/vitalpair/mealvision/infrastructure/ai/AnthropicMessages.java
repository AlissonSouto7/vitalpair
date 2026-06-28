package com.aps.vitalpair.mealvision.infrastructure.ai;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

/**
 * DTOs da API {@code POST /v1/messages} da Anthropic (apenas os campos usados pela análise de foto).
 *
 * <p>O corpo usa {@code output_config.format} (json_schema) para forçar a saída estruturada. Não
 * enviamos {@code temperature}/{@code top_p}/{@code top_k}/{@code thinking}: o modelo
 * {@code claude-opus-4-8} rejeita esses parâmetros com HTTP 400.
 */
final class AnthropicMessages {

    private AnthropicMessages() {
    }

    // ===== Request =====

    @JsonInclude(JsonInclude.Include.NON_NULL)
    record Request(
            String model,
            @JsonProperty("max_tokens") int maxTokens,
            String system,
            List<Message> messages,
            @JsonProperty("output_config") OutputConfig outputConfig) {
    }

    record Message(String role, List<Content> content) {
    }

    /** Bloco de conteúdo polimórfico: {@code type=image} usa {@code source}; {@code type=text} usa {@code text}. */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    record Content(String type, ImageSource source, String text) {

        static Content image(String mediaType, String base64Data) {
            return new Content("image", new ImageSource("base64", mediaType, base64Data), null);
        }

        static Content text(String text) {
            return new Content("text", null, text);
        }
    }

    record ImageSource(String type, @JsonProperty("media_type") String mediaType, String data) {
    }

    record OutputConfig(Format format) {
    }

    record Format(String type, Object schema) {

        static Format jsonSchema(Object schema) {
            return new Format("json_schema", schema);
        }
    }

    // ===== Response =====

    @JsonIgnoreProperties(ignoreUnknown = true)
    record Response(
            List<Block> content,
            @JsonProperty("stop_reason") String stopReason) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record Block(String type, String text) {
    }
}
