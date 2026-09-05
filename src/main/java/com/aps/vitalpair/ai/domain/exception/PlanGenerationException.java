package com.aps.vitalpair.ai.domain.exception;

import com.aps.vitalpair.shared.exception.DomainException;

/**
 * Falha ao gerar o plano pela IA (erro/timeout da Anthropic, recusa do modelo ou resposta
 * fora do formato esperado). Mapeada para HTTP 502 no
 * {@link com.aps.vitalpair.ai.infrastructure.web.AiPlanExceptionHandler}.
 */
public class PlanGenerationException extends DomainException {

    public PlanGenerationException(String message) {
        super(message);
    }

    public PlanGenerationException(String message, Throwable cause) {
        super(message, cause);
    }
}
