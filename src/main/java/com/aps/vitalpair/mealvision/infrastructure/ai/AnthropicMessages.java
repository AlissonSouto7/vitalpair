package com.aps.vitalpair.mealvision.infrastructure.ai;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * DTOs da API {@code POST /v1/messages} da Anthropic (apenas os campos usados pela análise de foto).
 *
 * <p>O corpo usa {@code output_config.format} (json_schema) para forçar a saída estruturada. Não
 * enviamos {@code temperature}/{@code top_p}/{@code top_k}/{@code thinking}: o modelo
 * {@code claude-opus-4-8} rejeita esses parâmetros com HTTP 400.
 *
 * <p>Esta classe e seus records são públicos porque aparecem na assinatura de
 * {@link AnthropicClient}, que é uma interface pública. O proxy dinâmico que o Feign gera vive em
 * outro módulo e não consegue acessar tipos package-private: deixá-los sem {@code public} faz a
 * chamada estourar {@code IllegalAccessError} em runtime.
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

    /** Bloco de conteúdo polimórfico: {@code type=image} usa {@code source}; {@code type=text} usa {@code text}. */
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
