package com.aps.vitalpair.entitlement.infrastructure.web;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.aps.vitalpair.entitlement.domain.exception.AiAccessRequiredException;
import com.aps.vitalpair.shared.web.ApiError;
import com.aps.vitalpair.shared.web.ApiErrors;
import com.aps.vitalpair.shared.web.ApiResponse;

/**
 * HTTP translation of the entitlement exceptions, in the same {@link ApiResponse} envelope as
 * every other error. A missing plan is 402: the one status that says "this costs money"
 * rather than "you are forbidden" or "we are down".
 */
@RestControllerAdvice
public class EntitlementExceptionHandler {

    @ExceptionHandler(AiAccessRequiredException.class)
    public ResponseEntity<ApiResponse<ApiError>> handleAiAccessRequired(
            AiAccessRequiredException ex, HttpServletRequest request) {
        return ApiErrors.response(HttpStatus.PAYMENT_REQUIRED, ex.getMessage(), request);
    }
}
