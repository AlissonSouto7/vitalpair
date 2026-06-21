package com.aps.vitapair.auth.infrastructure.web;

import com.aps.vitapair.auth.domain.exception.InvalidCredentialsException;
import com.aps.vitapair.shared.web.ApiError;
import com.aps.vitapair.shared.web.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import java.time.Instant;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/** Tratamento de erros específicos da feature auth. */
@RestControllerAdvice
public class AuthExceptionHandler {

    @ExceptionHandler(InvalidCredentialsException.class)
    public ResponseEntity<ApiResponse<ApiError>> handleInvalidCredentials(
            InvalidCredentialsException ex, HttpServletRequest request) {
        ApiError detail = new ApiError(
                Instant.now(),
                HttpStatus.UNAUTHORIZED.value(),
                HttpStatus.UNAUTHORIZED.getReasonPhrase(),
                request.getRequestURI(),
                List.of());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.fail(ex.getMessage(), detail));
    }
}
