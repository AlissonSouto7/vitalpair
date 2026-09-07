package com.aps.vitalpair.auth.domain.port.in;

/** Sends the confirmation e-mail again to an account not yet verified. */
public interface ResendEmailVerificationUseCase {

    void resend(String email);
}
