package com.aps.vitalpair.shared.web;

import java.nio.charset.StandardCharsets;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * Answers an unauthenticated request in the same envelope as every other error.
 *
 * <p>The previous entry point called {@code sendError}, which produced the servlet
 * container's HTML error page: a client that parses {@code {success, message, data}}
 * everywhere else received markup exactly when its session expired, with no request id to
 * report.
 *
 * <p>Lives beside the other web concerns rather than in {@code config}, so the security
 * configuration keeps depending on {@code shared.web} and not the other way round.
 */
@Component
public class JsonAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final ObjectMapper objectMapper;

    public JsonAuthenticationEntryPoint(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response, AuthenticationException ex)
            throws java.io.IOException {
        response.setStatus(HttpStatus.UNAUTHORIZED.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        ApiError error = ApiErrors.of(HttpStatus.UNAUTHORIZED, request);
        objectMapper.writeValue(response.getOutputStream(), ApiResponse.fail("Não autenticado", error));
    }
}
