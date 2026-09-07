package com.aps.vitalpair.shared.exception;

/** The requested resource does not exist (mapped to HTTP 404). */
public class ResourceNotFoundException extends DomainException {

    public ResourceNotFoundException(String message) {
        super(message);
    }

    public static ResourceNotFoundException of(String resource, Object id) {
        return new ResourceNotFoundException(resource + " não encontrado: " + id);
    }
}
