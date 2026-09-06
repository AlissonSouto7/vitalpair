package com.aps.vitalpair.shared.web;

import java.time.Instant;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Detalhe de erro retornado no campo {@code data} de um {@link ApiResponse} com {@code success=false}.
 *
 * @param requestId identificador da requisição, o mesmo que aparece no log do servidor. É o que
 *     permite a alguém relatar uma falha e a investigação achar a linha exata. Ausente quando o
 *     erro acontece fora de uma requisição.
 */
public record ApiError(
        Instant timestamp,
        int status,
        String error,
        String path,
        @JsonInclude(JsonInclude.Include.NON_NULL) String requestId,
        List<FieldViolation> violations) {

    /** Violação de um campo específico em erros de validação de DTO. */
    public record FieldViolation(String field, String message) {}
}
