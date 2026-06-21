package com.aps.vitapair.shared.exception;

/** Violação de uma regra de negócio (mapeada para HTTP 422). */
public class BusinessRuleException extends DomainException {

    public BusinessRuleException(String message) {
        super(message);
    }
}
