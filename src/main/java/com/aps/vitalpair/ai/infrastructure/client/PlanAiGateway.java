package com.aps.vitalpair.ai.infrastructure.client;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import com.aps.vitalpair.ai.domain.exception.AiPlanNotConfiguredException;
import com.aps.vitalpair.ai.domain.exception.PlanContentException;
import com.aps.vitalpair.ai.domain.exception.PlanGenerationException;
import com.aps.vitalpair.config.AnthropicProperties;
import com.aps.vitalpair.shared.metrics.AiMetrics;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;

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
    private final AiMetrics metrics;

    PlanAiGateway(AnthropicPlanClient client, AnthropicProperties properties, AiMetrics metrics) {
        this.client = client;
        this.properties = properties;
        this.metrics = metrics;
    }

    /**
     * Chama a IA e devolve o JSON (texto) já validado contra recusa/resposta vazia.
     *
     * <p>O disjuntor abre depois de metade das chamadas recentes falharem e passa a recusar na
     * hora, em vez de cada requisição esperar o timeout de sessenta segundos. Sem retentativa,
     * de propósito: repetir uma chamada paga e lenta multiplica custo e espera justamente quando
     * o parceiro está mal.
     *
     * @param kind identifica a chamada nas métricas
     */
    @CircuitBreaker(name = "anthropic", fallbackMethod = "unavailable")
    String generateJson(String kind, String systemPrompt, String userPrompt, Object schema, int maxTokens) {
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
            response = metrics.timed(kind, () -> client.createMessage(request));
        } catch (RuntimeException ex) {
            log.warn("Falha ao chamar a Anthropic para gerar plano: {}", ex.getMessage(), ex);
            throw new PlanGenerationException(
                    "Não foi possível gerar o plano agora. Tente novamente em instantes.", ex);
        }

        // What follows are answers, not outages: the partner replied, and the reply is not
        // usable. They are deliberately thrown outside the breaker's failure accounting (see
        // the ignore-exceptions configuration), because a handful of odd prompts must not
        // take plan generation down for everyone.
        if (response == null) {
            throw new PlanContentException("A IA não retornou nenhuma resposta.");
        }
        if ("refusal".equals(response.stopReason())) {
            throw new PlanContentException("A IA não conseguiu montar o plano. Tente novamente.");
        }
        if (response.content() == null) {
            throw new PlanContentException("A IA retornou uma resposta vazia.");
        }
        return response.content().stream()
                .filter(block -> "text".equals(block.type())
                        && block.text() != null
                        && !block.text().isBlank())
                .map(PlanMessages.Block::text)
                .findFirst()
                .orElseThrow(() -> new PlanContentException("A IA não retornou o plano gerado."));
    }

    /**
     * Runs when the breaker is open, and whenever the call above throws.
     *
     * <p>The domain exceptions are rethrown untouched: they already carry the right message and
     * the right status, and turning "your profile is incomplete" into "the AI is unavailable"
     * would be a lie. Only a call that never reached a conclusion becomes the generic failure.
     */
    @SuppressWarnings("unused")
    private String unavailable(
            String kind, String systemPrompt, String userPrompt, Object schema, int maxTokens, Throwable cause) {
        if (cause instanceof AiPlanNotConfiguredException notConfigured) {
            throw notConfigured;
        }
        if (cause instanceof PlanGenerationException generationFailure) {
            throw generationFailure;
        }
        // CallNotPermittedException, thrown by the open breaker, lands here.
        log.warn("Anthropic circuit is open, refusing {} without calling", kind);
        throw new PlanGenerationException("A geração por IA está indisponível no momento. Tente em alguns minutos.");
    }
}
