package com.aps.vitalpair.ai.domain.exception;

import com.aps.vitalpair.shared.exception.DomainException;

/**
 * Today's workout has already been marked done, which stops the activity being logged twice.
 * Mapped to HTTP 409 in {@link com.aps.vitalpair.ai.infrastructure.web.AiPlanExceptionHandler}.
 */
public class WorkoutAlreadyCompletedException extends DomainException {

    public WorkoutAlreadyCompletedException(String message) {
        super(message);
    }
}
