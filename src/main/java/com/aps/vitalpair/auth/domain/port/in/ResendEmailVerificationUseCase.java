package com.aps.vitalpair.auth.domain.port.in;

/** Reenvia o e-mail de confirmação para uma conta ainda não verificada. */
public interface ResendEmailVerificationUseCase {

    void resend(String email);
}
