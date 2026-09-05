package com.aps.vitalpair.ai.infrastructure.web;

import com.aps.vitalpair.ai.domain.exception.AiPlanNotConfiguredException;
import com.aps.vitalpair.ai.domain.exception.PlanGenerationException;
import com.aps.vitalpair.ai.domain.exception.WorkoutAlreadyCompletedException;
import com.aps.vitalpair.shared.web.ApiError;
import com.aps.vitalpair.shared.web.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import java.time.Instant;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Tradução para HTTP das exceções específicas dos planos por IA, no mesmo formato
 * {@link ApiResponse} do {@link com.aps.vitalpair.shared.web.RestExceptionHandler}.
 * IA não configurada vira 503; falha na geração vira 502; treino já concluído vira 409.
 */
@RestControllerAdvice
public class AiPlanExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(AiPlanExceptionHandler.class);

    @ExceptionHandler(AiPlanNotConfiguredException.class)
    public ResponseEntity<ApiResponse<ApiError>> handleNotConfigured(
            AiPlanNotConfiguredException ex, HttpServletRequest request) {
        return build(HttpStatus.SERVICE_UNAVAILABLE, ex.getMessage(), request);
    }

    @ExceptionHandler(PlanGenerationException.class)
    public ResponseEntity<ApiResponse<ApiError>> handleGenerationFailure(
            PlanGenerationException ex, HttpServletRequest request) {
        log.warn("Falha na geração de plano em {}: {}", request.getRequestURI(), ex.getMessage());
        return build(HttpStatus.BAD_GATEWAY, ex.getMessage(), request);
    }

    @ExceptionHandler(WorkoutAlreadyCompletedException.class)
    public ResponseEntity<ApiResponse<ApiError>> handleAlreadyCompleted(
            WorkoutAlreadyCompletedException ex, HttpServletRequest request) {
        return build(HttpStatus.CONFLICT, ex.getMessage(), request);
    }

    private ResponseEntity<ApiResponse<ApiError>> build(
            HttpStatus status, String message, HttpServletRequest request) {
        ApiError detail = new ApiError(
                Instant.now(), status.value(), status.getReasonPhrase(), request.getRequestURI(), List.of());
        return ResponseEntity.status(status).body(ApiResponse.fail(message, detail));
    }
}
