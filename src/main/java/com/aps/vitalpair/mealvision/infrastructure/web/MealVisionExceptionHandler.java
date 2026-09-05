package com.aps.vitalpair.mealvision.infrastructure.web;

import java.time.Instant;
import java.util.List;

import jakarta.servlet.http.HttpServletRequest;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.aps.vitalpair.mealvision.domain.exception.AiNotConfiguredException;
import com.aps.vitalpair.mealvision.domain.exception.MealPhotoAnalysisException;
import com.aps.vitalpair.shared.web.ApiError;
import com.aps.vitalpair.shared.web.ApiResponse;

/**
 * Tradução para HTTP das exceções específicas da análise de foto, no mesmo formato
 * {@link ApiResponse} do {@link com.aps.vitalpair.shared.web.RestExceptionHandler}.
 * IA não configurada vira 503; falha na análise vira 502.
 */
@RestControllerAdvice
public class MealVisionExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(MealVisionExceptionHandler.class);

    @ExceptionHandler(AiNotConfiguredException.class)
    public ResponseEntity<ApiResponse<ApiError>> handleNotConfigured(
            AiNotConfiguredException ex, HttpServletRequest request) {
        return build(HttpStatus.SERVICE_UNAVAILABLE, ex.getMessage(), request);
    }

    @ExceptionHandler(MealPhotoAnalysisException.class)
    public ResponseEntity<ApiResponse<ApiError>> handleAnalysisFailure(
            MealPhotoAnalysisException ex, HttpServletRequest request) {
        log.warn("Falha na análise de foto em {}: {}", request.getRequestURI(), ex.getMessage());
        return build(HttpStatus.BAD_GATEWAY, ex.getMessage(), request);
    }

    private ResponseEntity<ApiResponse<ApiError>> build(HttpStatus status, String message, HttpServletRequest request) {
        ApiError detail = new ApiError(
                Instant.now(), status.value(), status.getReasonPhrase(), request.getRequestURI(), List.of());
        return ResponseEntity.status(status).body(ApiResponse.fail(message, detail));
    }
}
