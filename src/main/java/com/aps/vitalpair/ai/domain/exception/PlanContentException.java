package com.aps.vitalpair.ai.domain.exception;

/**
 * The model answered, and the answer is unusable: a refusal, an empty response, or one outside
 * the expected shape.
 *
 * <p>Distinct from {@link PlanGenerationException} because of the circuit breaker. A network
 * error, a timeout or a 5xx mean the partner is down and must count towards opening the
 * circuit; a refusal or a malformed answer is a normal reply to one particular request. Without
 * the split, a handful of unusual prompts would take plan generation down for everyone for a
 * minute.
 *
 * <p>Still mapped to HTTP 502, because from the caller's side the outcome is the same: no plan.
 */
public class PlanContentException extends PlanGenerationException {

    public PlanContentException(String message) {
        super(message);
    }

    public PlanContentException(String message, Throwable cause) {
        super(message, cause);
    }
}
