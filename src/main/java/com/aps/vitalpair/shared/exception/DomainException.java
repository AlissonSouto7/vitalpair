package com.aps.vitalpair.shared.exception;

/**
 * Base de todas as exceções de regra de negócio do domínio.
 * É lançada pelo {@code domain}/{@code application} e traduzida para HTTP no
 * {@link com.aps.vitalpair.shared.web.RestExceptionHandler}.
 */
public abstract class DomainException extends RuntimeException {

    protected DomainException(String message) {
        super(message);
    }

    protected DomainException(String message, Throwable cause) {
        super(message, cause);
    }
}
