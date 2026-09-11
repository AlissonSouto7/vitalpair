package com.aps.vitalpair.entitlement.domain.exception;

/**
 * The caller asked for an AI feature without a plan that includes it.
 *
 * <p>Mapped to HTTP 402 by the feature's exception handler: not 403, which the client reads
 * as "you are not allowed here", and not 503, which the AI features answer when the model
 * itself is unavailable and which would tell a free user to try again in a few minutes for
 * something no amount of waiting will open. The message is what the person sees.
 */
public class AiAccessRequiredException extends RuntimeException {

    public AiAccessRequiredException() {
        super("Esse recurso faz parte do plano pago.");
    }
}
