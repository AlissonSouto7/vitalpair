package com.aps.vitalpair.ai.domain.exception;

import com.aps.vitalpair.shared.exception.DomainException;

/**
 * O treino de hoje já foi marcado como concluído (evita registrar a atividade em dobro).
 * Mapeada para HTTP 409 no {@link com.aps.vitalpair.ai.infrastructure.web.AiPlanExceptionHandler}.
 */
public class WorkoutAlreadyCompletedException extends DomainException {

    public WorkoutAlreadyCompletedException(String message) {
        super(message);
    }
}
