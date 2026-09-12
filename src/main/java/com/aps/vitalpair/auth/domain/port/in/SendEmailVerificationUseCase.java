package com.aps.vitalpair.auth.domain.port.in;

import java.util.UUID;

/** The two e-mails registration can send, one per branch of it. */
public interface SendEmailVerificationUseCase {

    /** Sends the account confirmation e-mail, for an address that had no account. */
    void send(UUID userId, String email, String name);

    /**
     * Tells the owner of an address that somebody tried to register with it.
     *
     * <p>The other branch of the same fork. Registration answers the same thing either way,
     * so that it cannot be used to find out who is registered, and the difference happens
     * here, in a mailbox only its owner reads. It carries no token: there is nothing to
     * activate, and a link that granted anything would turn a warning into the very thing it
     * warns about.
     */
    void warnAboutRegistrationAttempt(String email, String name);
}
