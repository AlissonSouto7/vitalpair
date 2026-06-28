package com.aps.vitalpair.mealvision.domain.exception;

import com.aps.vitalpair.shared.exception.DomainException;

/**
 * A integração de IA (Anthropic) não está configurada: a chave de API está em branco.
 * Mapeada para HTTP 503 no {@link com.aps.vitalpair.mealvision.infrastructure.web.MealVisionExceptionHandler}.
 */
public class AiNotConfiguredException extends DomainException {

    public AiNotConfiguredException(String message) {
        super(message);
    }
}
