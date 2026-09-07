package com.aps.vitalpair.shared.exception;

/** A business rule violation (mapped to HTTP 422). */
public class BusinessRuleException extends DomainException {

    public BusinessRuleException(String message) {
        super(message);
    }
}
