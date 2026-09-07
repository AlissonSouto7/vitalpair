package com.aps.vitalpair.shared.web;

import java.util.Arrays;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;

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
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.exc.InvalidFormatException;

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

    /**
     * Validation on a query parameter, as opposed to a request body.
     *
     * <p>Constraints on a method parameter raise a different exception from constraints on a
     * body, and without this handler it reached the generic one: a negative {@code ?size=}
     * came back as 500 and logged a stack trace for what is plainly bad input.
     */
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiResponse<ApiError>> handleParameterValidation(
            ConstraintViolationException ex, HttpServletRequest request) {
        List<ApiError.FieldViolation> violations = ex.getConstraintViolations().stream()
                .map(violation -> new ApiError.FieldViolation(lastNode(violation), violation.getMessage()))
                .toList();
        return ApiErrors.response(HttpStatus.BAD_REQUEST, "Erro de validação", request, violations);
    }

    /** The parameter name, which is the last node of a path like {@code feed.size}. */
    private String lastNode(ConstraintViolation<?> violation) {
        String path = violation.getPropertyPath().toString();
        int dot = path.lastIndexOf('.');
        return dot >= 0 ? path.substring(dot + 1) : path;
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
        return ApiErrors.response(
                HttpStatus.BAD_REQUEST,
                "Corpo da requisição inválido ou mal formatado",
                request,
                unreadableViolations(ex));
    }

    /**
     * Names the field Jackson choked on, when it can be worked out.
     *
     * <p>A wrong enum value produces the same "corpo inválido" as a truncated body, with an
     * empty violations list, so the caller is told only that something is wrong somewhere.
     * Sending {@code activityType: "WALKING"} instead of {@code "WALK"} costs a round of
     * guesswork that the exception already has the answer to. The accepted values are
     * included because the whole difficulty is not knowing them.
     */
    private List<ApiError.FieldViolation> unreadableViolations(HttpMessageNotReadableException ex) {
        if (!(ex.getCause() instanceof InvalidFormatException cause)) {
            return List.of();
        }
        String field = cause.getPath().stream()
                .map(JsonMappingException.Reference::getFieldName)
                .filter(Objects::nonNull)
                .collect(Collectors.joining("."));
        if (field.isBlank()) {
            return List.of();
        }
        Class<?> target = cause.getTargetType();
        String message = target != null && target.isEnum()
                ? "valor inválido. Aceitos: "
                        + Arrays.stream(target.getEnumConstants())
                                .map(String::valueOf)
                                .collect(Collectors.joining(", "))
                : "valor inválido para este campo";
        return List.of(new ApiError.FieldViolation(field, message));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<ApiError>> handleGeneric(Exception ex, HttpServletRequest request) {
        // The request id is in the MDC, so it lands in this line and in the body below: the
        // string the user reports is the one that finds this stack trace.
        log.error("Erro não tratado em {}", LogSafe.value(request.getRequestURI()), ex);
        return ApiErrors.response(HttpStatus.INTERNAL_SERVER_ERROR, "Erro interno inesperado", request);
    }
}
