package com.aps.vitalpair.shared.web;

import java.util.List;

import jakarta.servlet.http.HttpServletRequest;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import com.aps.vitalpair.shared.exception.BusinessRuleException;
import com.aps.vitalpair.shared.exception.ResourceNotFoundException;

/**
 * Tratamento global de erros. Traduz exceções em respostas {@link ApiResponse} padronizadas,
 * sempre com {@code success=false} e um {@link ApiError} no campo {@code data}.
 */
@RestControllerAdvice
public class RestExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(RestExceptionHandler.class);

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<ApiError>> handleNotFound(
            ResourceNotFoundException ex, HttpServletRequest request) {
        return ApiErrors.response(HttpStatus.NOT_FOUND, ex.getMessage(), request);
    }

    @ExceptionHandler(BusinessRuleException.class)
    public ResponseEntity<ApiResponse<ApiError>> handleBusinessRule(
            BusinessRuleException ex, HttpServletRequest request) {
        return ApiErrors.response(HttpStatus.UNPROCESSABLE_ENTITY, ex.getMessage(), request);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<ApiError>> handleValidation(
            MethodArgumentNotValidException ex, HttpServletRequest request) {
        List<ApiError.FieldViolation> violations = ex.getBindingResult().getFieldErrors().stream()
                .map(fe -> new ApiError.FieldViolation(fe.getField(), fe.getDefaultMessage()))
                .toList();
        return ApiErrors.response(HttpStatus.BAD_REQUEST, "Erro de validação", request, violations);
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ApiResponse<ApiError>> handleNoResource(
            NoResourceFoundException ex, HttpServletRequest request) {
        return ApiErrors.response(HttpStatus.NOT_FOUND, "Recurso não encontrado", request);
    }

    /**
     * A caller who is authenticated but lacks the role.
     *
     * <p>Must be handled explicitly. Without this, the generic handler below catches it and
     * answers 500, which says "the server broke" when the truth is "the guard worked". It
     * also hides a genuine authorisation failure inside the noise of real errors, and logs
     * a stack trace for something that is not a fault.
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<ApiError>> handleAccessDenied(
            AccessDeniedException ex, HttpServletRequest request) {
        return ApiErrors.response(HttpStatus.FORBIDDEN, "Você não tem permissão para acessar este recurso", request);
    }

    /**
     * A body the server cannot parse: malformed JSON, invalid UTF-8, a wrong type in a field.
     *
     * <p>That is the caller's mistake, so the answer is 400. Without this handler it fell
     * through to the generic one and came back as 500, which tells the client the server
     * broke and logs a stack trace for what is really bad input. Found when a shell sent a
     * name with an accent as invalid bytes.
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiResponse<ApiError>> handleUnreadable(
            HttpMessageNotReadableException ex, HttpServletRequest request) {
        return ApiErrors.response(HttpStatus.BAD_REQUEST, "Corpo da requisição inválido ou mal formatado", request);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<ApiError>> handleGeneric(Exception ex, HttpServletRequest request) {
        // The request id is in the MDC, so it lands in this line and in the body below: the
        // string the user reports is the one that finds this stack trace.
        log.error("Erro não tratado em {}", LogSafe.value(request.getRequestURI()), ex);
        return ApiErrors.response(HttpStatus.INTERNAL_SERVER_ERROR, "Erro interno inesperado", request);
    }
}
