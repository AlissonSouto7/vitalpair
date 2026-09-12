package com.aps.vitalpair.auth.domain.exception;

/**
 * The credentials are right but the address was never confirmed.
 *
 * <p>Separate from {@link InvalidCredentialsException} on purpose, and it answers 403 rather
 * than 401: the password was accepted, so telling the person "wrong credentials" would send
 * them to reset a password that works. It does not leak anything registration does not
 * already require, because reaching it means having the right password for the address.
 */
public class EmailNotVerifiedException extends RuntimeException {

    public EmailNotVerifiedException(String message) {
        super(message);
    }
}
