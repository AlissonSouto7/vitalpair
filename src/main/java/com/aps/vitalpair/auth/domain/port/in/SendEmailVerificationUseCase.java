package com.aps.vitalpair.auth.domain.port.in;

import java.util.UUID;

/** Dispara o envio do e-mail de confirmação de conta (usado logo após o cadastro). */
public interface SendEmailVerificationUseCase {

    void send(UUID userId, String email, String name);
}
