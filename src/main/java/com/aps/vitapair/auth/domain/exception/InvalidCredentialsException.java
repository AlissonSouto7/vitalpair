package com.aps.vitapair.auth.domain.exception;

import com.aps.vitapair.shared.exception.DomainException;

/** Credenciais ou token inválidos (mapeada para HTTP 401). */
public class InvalidCredentialsException extends DomainException {

    public InvalidCredentialsException(String message) {
        super(message);
    }
}
