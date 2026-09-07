package com.aps.vitalpair.mealvision.infrastructure.web;

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
import com.aps.vitalpair.shared.web.ApiErrors;
import com.aps.vitalpair.shared.web.ApiResponse;
import com.aps.vitalpair.shared.web.LogSafe;

/**
 * HTTP translation of the exceptions specific to photo analysis, in the same
 * {@link ApiResponse} shape as {@link com.aps.vitalpair.shared.web.RestExceptionHandler}. AI not
 * configured is 503; a failed analysis is 502.
 */
@RestControllerAdvice
public class MealVisionExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(MealVisionExceptionHandler.class);

    @ExceptionHandler(AiNotConfiguredException.class)
    public ResponseEntity<ApiResponse<ApiError>> handleNotConfigured(
            AiNotConfiguredException ex, HttpServletRequest request) {
        return ApiErrors.response(HttpStatus.SERVICE_UNAVAILABLE, ex.getMessage(), request);
    }

    @ExceptionHandler(MealPhotoAnalysisException.class)
    public ResponseEntity<ApiResponse<ApiError>> handleAnalysisFailure(
            MealPhotoAnalysisException ex, HttpServletRequest request) {
        log.warn("Falha na análise de foto em {}: {}", LogSafe.value(request.getRequestURI()), ex.getMessage(), ex);
        return ApiErrors.response(HttpStatus.BAD_GATEWAY, ex.getMessage(), request);
    }
}
