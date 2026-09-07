package com.aps.vitalpair.mealvision.domain.exception;

import com.aps.vitalpair.shared.exception.DomainException;

/**
 * The AI integration (Anthropic) is not configured: the API key is blank. Mapped to HTTP 503 in
 * {@link com.aps.vitalpair.mealvision.infrastructure.web.MealVisionExceptionHandler}.
 */
public class AiNotConfiguredException extends DomainException {

    public AiNotConfiguredException(String message) {
        super(message);
    }
}
