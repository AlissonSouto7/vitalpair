package com.aps.vitalpair.shared.web;

import java.time.Instant;
import java.util.List;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

/**
 * Builds the error body every handler returns.
 *
 * <p>Five places used to assemble it by hand with the same five lines. That is how the
 * request id would go missing from one of them: a field added to the record compiles
 * everywhere and is silently left null wherever someone forgot. Going through one factory
 * means an error response cannot be built without it.
 */
public final class ApiErrors {

    private ApiErrors() {}

    public static ApiError of(HttpStatus status, HttpServletRequest request) {
        return of(status, request, List.of());
    }

    public static ApiError of(HttpStatus status, HttpServletRequest request, List<ApiError.FieldViolation> violations) {
        return new ApiError(
                Instant.now(),
                status.value(),
                status.getReasonPhrase(),
                request.getRequestURI(),
                RequestContext.requestId(),
                violations);
    }

    /** The complete response: the envelope, the status and the message the client shows. */
    public static ResponseEntity<ApiResponse<ApiError>> response(
            HttpStatus status, String message, HttpServletRequest request) {
        return response(status, message, request, List.of());
    }

    public static ResponseEntity<ApiResponse<ApiError>> response(
            HttpStatus status, String message, HttpServletRequest request, List<ApiError.FieldViolation> violations) {
        return ResponseEntity.status(status).body(ApiResponse.fail(message, of(status, request, violations)));
    }
}
