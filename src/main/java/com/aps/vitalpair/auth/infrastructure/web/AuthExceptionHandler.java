package com.aps.vitalpair.auth.infrastructure.web;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.aps.vitalpair.auth.domain.exception.EmailNotVerifiedException;
import com.aps.vitalpair.auth.domain.exception.InvalidCredentialsException;
import com.aps.vitalpair.shared.web.ApiError;
import com.aps.vitalpair.shared.web.ApiErrors;
import com.aps.vitalpair.shared.web.ApiResponse;

/** Handles the errors specific to the auth feature. */
@RestControllerAdvice
public class AuthExceptionHandler {

    @ExceptionHandler(InvalidCredentialsException.class)
    public ResponseEntity<ApiResponse<ApiError>> handleInvalidCredentials(
            InvalidCredentialsException ex, HttpServletRequest request) {
        return ApiErrors.response(HttpStatus.UNAUTHORIZED, ex.getMessage(), request);
    }

    /**
     * 403 rather than 401: the password was right, so the client must not send the person to
     * reset a password that works. The screen asks them to confirm the address instead.
     */
    @ExceptionHandler(EmailNotVerifiedException.class)
    public ResponseEntity<ApiResponse<ApiError>> handleEmailNotVerified(
            EmailNotVerifiedException ex, HttpServletRequest request) {
        return ApiErrors.response(HttpStatus.FORBIDDEN, ex.getMessage(), request);
    }
}
