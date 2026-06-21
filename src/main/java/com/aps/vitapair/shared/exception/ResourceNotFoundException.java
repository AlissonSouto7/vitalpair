package com.aps.vitapair.shared.exception;

/** Recurso solicitado não existe (mapeada para HTTP 404). */
public class ResourceNotFoundException extends DomainException {

    public ResourceNotFoundException(String message) {
        super(message);
    }

    public static ResourceNotFoundException of(String resource, Object id) {
        return new ResourceNotFoundException(resource + " não encontrado: " + id);
    }
}
