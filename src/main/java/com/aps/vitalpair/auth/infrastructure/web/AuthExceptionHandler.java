package com.aps.vitalpair.auth.infrastructure.web;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.aps.vitalpair.auth.domain.exception.InvalidCredentialsException;
import com.aps.vitalpair.shared.web.ApiError;
import com.aps.vitalpair.shared.web.ApiErrors;
import com.aps.vitalpair.shared.web.ApiResponse;

/** Tratamento de erros específicos da feature auth. */
@RestControllerAdvice
public class AuthExceptionHandler {

    @ExceptionHandler(InvalidCredentialsException.class)
    public ResponseEntity<ApiResponse<ApiError>> handleInvalidCredentials(
            InvalidCredentialsException ex, HttpServletRequest request) {
        return ApiErrors.response(HttpStatus.UNAUTHORIZED, ex.getMessage(), request);
    }
}
