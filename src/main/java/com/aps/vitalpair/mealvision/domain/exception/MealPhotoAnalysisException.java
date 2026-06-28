package com.aps.vitalpair.mealvision.domain.exception;

import com.aps.vitalpair.shared.exception.DomainException;

/**
 * Falha ao analisar a foto pela IA (erro/timeout da Anthropic, recusa do modelo ou resposta
 * fora do formato esperado). Mapeada para HTTP 502 no
 * {@link com.aps.vitalpair.mealvision.infrastructure.web.MealVisionExceptionHandler}.
 */
public class MealPhotoAnalysisException extends DomainException {

    public MealPhotoAnalysisException(String message) {
        super(message);
    }

    public MealPhotoAnalysisException(String message, Throwable cause) {
        super(message, cause);
    }
}
