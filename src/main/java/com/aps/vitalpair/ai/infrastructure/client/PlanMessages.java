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
 */
final class PlanMessages {

    private PlanMessages() {
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

    record Content(String type, String text) {

        static Content text(String text) {
            return new Content("text", text);
        }
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
