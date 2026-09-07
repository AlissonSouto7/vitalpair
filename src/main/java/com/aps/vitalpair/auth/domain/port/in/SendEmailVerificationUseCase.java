package com.aps.vitalpair.auth.domain.port.in;

import java.util.UUID;

/** Sends the account confirmation e-mail (used right after registration). */
public interface SendEmailVerificationUseCase {

    void send(UUID userId, String email, String name);
}
