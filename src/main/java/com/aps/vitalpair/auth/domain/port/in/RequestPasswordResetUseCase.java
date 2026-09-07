package com.aps.vitalpair.auth.domain.port.in;

/** Starts a password reset: generates a token and sends the link by e-mail. */
public interface RequestPasswordResetUseCase {

    /**
     * Always completes without error, even when the address is unknown: revealing whether an
     * account exists would let anyone enumerate users.
     */
    void requestReset(String email);
}
