package com.aps.vitapair.shared.web;

import java.time.Instant;
import java.util.List;

/**
 * Detalhe de erro retornado no campo {@code data} de um {@link ApiResponse} com {@code success=false}.
 */
public record ApiError(
        Instant timestamp,
        int status,
        String error,
        String path,
        List<FieldViolation> violations) {

    /** Violação de um campo específico em erros de validação de DTO. */
    public record FieldViolation(String field, String message) {
    }
}
