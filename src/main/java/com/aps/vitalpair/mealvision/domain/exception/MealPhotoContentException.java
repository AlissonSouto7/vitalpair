package com.aps.vitalpair.mealvision.domain.exception;

/**
 * The model answered, and the answer is unusable: a refusal, an empty response, or one outside
 * the expected shape.
 *
 * <p>Separate from {@link MealPhotoAnalysisException} for the same reason as in the AI plans:
 * the circuit breaker must count only failures that mean the partner is down. A photo the model
 * declines to analyse is an answer, and must not take analysis down for everyone.
 *
 * <p>Still mapped to HTTP 502.
 */
public class MealPhotoContentException extends MealPhotoAnalysisException {

    public MealPhotoContentException(String message) {
        super(message);
    }

    public MealPhotoContentException(String message, Throwable cause) {
        super(message, cause);
    }
}
