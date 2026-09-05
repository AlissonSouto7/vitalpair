package com.aps.vitalpair.auth.application.dto;

import java.util.UUID;

/** Resultado de um caso de uso de autenticação. */
public record AuthResult(String accessToken, String refreshToken, UUID userId) {}
