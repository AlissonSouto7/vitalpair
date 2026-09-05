package com.aps.vitalpair.ai.infrastructure.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

/**
 * DTOs da API {@code POST /v1/messages} da Anthropic para geração de planos (só texto, sem imagem).
 *
 * <p>O corpo usa {@code output_config.format} (json_schema) para forçar a saída estruturada. Não
 * enviamos {@code temperature}/{@code top_p}/{@code top_k}/{@code thinking}: o modelo
 * {@code claude-opus-4-8} rejeita esses parâmetros com HTTP 400.
 *
 * <p>Esta classe e os records {@code Request}/{@code Response} são públicos porque aparecem na
 * assinatura de {@link AnthropicPlanClient}, que é uma interface pública. O proxy dinâmico que o
 * Feign gera vive em outro módulo e não consegue acessar tipos package-private: deixá-los sem
 * {@code public} faz a chamada estourar {@code IllegalAccessError} em runtime.
 */
public final class PlanMessages {

    private PlanMessages() {
    }

    // ===== Request =====

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record Request(
            String model,
            @JsonProperty("max_tokens") int maxTokens,
            String system,
            List<Message> messages,
            @JsonProperty("output_config") OutputConfig outputConfig) {
    }

    public record Message(String role, List<Content> content) {
    }

    public record Content(String type, String text) {

        static Content text(String text) {
            return new Content("text", text);
        }
    }

    public record OutputConfig(Format format) {
    }

    public record Format(String type, Object schema) {

        static Format jsonSchema(Object schema) {
            return new Format("json_schema", schema);
        }
    }

    // ===== Response =====

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Response(
            List<Block> content,
            @JsonProperty("stop_reason") String stopReason) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Block(String type, String text) {
    }
}
