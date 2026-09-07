package com.aps.vitalpair.ai.infrastructure.web;

import jakarta.servlet.http.HttpServletRequest;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.aps.vitalpair.ai.domain.exception.AiPlanNotConfiguredException;
import com.aps.vitalpair.ai.domain.exception.PlanGenerationException;
import com.aps.vitalpair.ai.domain.exception.WorkoutAlreadyCompletedException;
import com.aps.vitalpair.shared.web.ApiError;
import com.aps.vitalpair.shared.web.ApiErrors;
import com.aps.vitalpair.shared.web.ApiResponse;
import com.aps.vitalpair.shared.web.LogSafe;

/**
 * HTTP translation of the exceptions specific to the AI plans, in the same {@link ApiResponse}
 * shape as {@link com.aps.vitalpair.shared.web.RestExceptionHandler}. AI not configured is 503;
 * a failed generation is 502; a workout already completed is 409.
 */
@RestControllerAdvice
public class AiPlanExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(AiPlanExceptionHandler.class);

    @ExceptionHandler(AiPlanNotConfiguredException.class)
    public ResponseEntity<ApiResponse<ApiError>> handleNotConfigured(
            AiPlanNotConfiguredException ex, HttpServletRequest request) {
        return ApiErrors.response(HttpStatus.SERVICE_UNAVAILABLE, ex.getMessage(), request);
    }

    @ExceptionHandler(PlanGenerationException.class)
    public ResponseEntity<ApiResponse<ApiError>> handleGenerationFailure(
            PlanGenerationException ex, HttpServletRequest request) {
        log.warn("Falha na geração de plano em {}: {}", LogSafe.value(request.getRequestURI()), ex.getMessage(), ex);
        return ApiErrors.response(HttpStatus.BAD_GATEWAY, ex.getMessage(), request);
    }

    @ExceptionHandler(WorkoutAlreadyCompletedException.class)
    public ResponseEntity<ApiResponse<ApiError>> handleAlreadyCompleted(
            WorkoutAlreadyCompletedException ex, HttpServletRequest request) {
        return ApiErrors.response(HttpStatus.CONFLICT, ex.getMessage(), request);
    }
}
