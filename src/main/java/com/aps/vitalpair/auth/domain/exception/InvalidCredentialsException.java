package com.aps.vitalpair.auth.domain.exception;

import com.aps.vitalpair.shared.exception.DomainException;

/** Invalid credentials or token (mapped to HTTP 401). */
public class InvalidCredentialsException extends DomainException {

    public InvalidCredentialsException(String message) {
        super(message);
    }
}
