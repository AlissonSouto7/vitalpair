package com.aps.vitalpair.auth.domain.port.in;

import com.aps.vitalpair.auth.application.dto.RegisterCommand;

public interface RegisterUserUseCase {

    /**
     * Starts a registration and tells the person to check their e-mail.
     *
     * <p>Returns nothing, deliberately. A return value that differed between a new address and
     * one that already has an account would be exactly the oracle this flow exists to close:
     * the caller cannot tell the two apart, and what differs happens in the mailbox, which only
     * its owner reads. A new address receives an activation link; an address that already has
     * an account receives a notice that somebody tried to register with it.
     */
    void register(RegisterCommand command);
}
