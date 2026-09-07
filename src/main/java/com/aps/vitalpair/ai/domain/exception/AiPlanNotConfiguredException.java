package com.aps.vitalpair.ai.domain.exception;

import com.aps.vitalpair.shared.exception.DomainException;

/**
 * The AI integration (Anthropic) is not configured: the API key is blank. Mapped to HTTP 503 in
 * {@link com.aps.vitalpair.ai.infrastructure.web.AiPlanExceptionHandler}.
 */
public class AiPlanNotConfiguredException extends DomainException {

    public AiPlanNotConfiguredException(String message) {
        super(message);
    }
}
