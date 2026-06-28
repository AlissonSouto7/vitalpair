package com.aps.vitalpair.auth.domain.port.in;

/** Confirma a conta a partir do token recebido por e-mail. */
public interface VerifyEmailUseCase {

    void verify(String token);
}
