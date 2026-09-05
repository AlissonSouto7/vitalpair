package com.aps.vitalpair.ai.infrastructure.client;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import com.aps.vitalpair.ai.domain.exception.AiPlanNotConfiguredException;
import com.aps.vitalpair.ai.domain.exception.PlanGenerationException;
import com.aps.vitalpair.config.AnthropicProperties;

/**
 * Passo comum das gerações por IA: valida a configuração, chama a Anthropic com saída
 * estruturada (json_schema) e devolve o bloco de texto (JSON) da resposta, traduzindo
 * erro/timeout/recusa em {@link PlanGenerationException} (HTTP 502).
 */
@Component
class PlanAiGateway {

    private static final Logger log = LoggerFactory.getLogger(PlanAiGateway.class);

    private final AnthropicPlanClient client;
    private final AnthropicProperties properties;

    PlanAiGateway(AnthropicPlanClient client, AnthropicProperties properties) {
        this.client = client;
        this.properties = properties;
    }

    /** Chama a IA e devolve o JSON (texto) já validado contra recusa/resposta vazia. */
    String generateJson(String systemPrompt, String userPrompt, Object schema, int maxTokens) {
        if (!properties.isConfigured()) {
            throw new AiPlanNotConfiguredException(
                    "O plano por IA ainda não está ligado. Configure a chave da IA no servidor.");
        }

        PlanMessages.Request request = new PlanMessages.Request(
                properties.model(),
                maxTokens,
                systemPrompt,
                List.of(new PlanMessages.Message("user", List.of(PlanMessages.Content.text(userPrompt)))),
                new PlanMessages.OutputConfig(PlanMessages.Format.jsonSchema(schema)));

        PlanMessages.Response response;
        try {
            response = client.createMessage(request);
        } catch (RuntimeException ex) {
            log.warn("Falha ao chamar a Anthropic para gerar plano: {}", ex.getMessage());
            throw new PlanGenerationException(
                    "Não foi possível gerar o plano agora. Tente novamente em instantes.", ex);
        }

        if (response == null) {
            throw new PlanGenerationException("A IA não retornou nenhuma resposta.");
        }
        if ("refusal".equals(response.stopReason())) {
            throw new PlanGenerationException("A IA não conseguiu montar o plano. Tente novamente.");
        }
        if (response.content() == null) {
            throw new PlanGenerationException("A IA retornou uma resposta vazia.");
        }
        return response.content().stream()
                .filter(block -> "text".equals(block.type())
                        && block.text() != null
                        && !block.text().isBlank())
                .map(PlanMessages.Block::text)
                .findFirst()
                .orElseThrow(() -> new PlanGenerationException("A IA não retornou o plano gerado."));
    }
}
