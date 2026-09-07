package com.aps.vitalpair.shared.exception;

/**
 * The base of every business rule exception of the domain. Thrown by {@code domain} and
 * {@code application}, translated to HTTP in {@link com.aps.vitalpair.shared.web.RestExceptionHandler}.
 */
public abstract class DomainException extends RuntimeException {

    protected DomainException(String message) {
        super(message);
    }

    protected DomainException(String message, Throwable cause) {
        super(message, cause);
    }
}
