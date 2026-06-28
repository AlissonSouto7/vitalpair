package com.aps.vitalpair.auth.application.dto;

/** Dados de entrada do caso de uso de login. */
public record LoginCommand(String email, String password) {
}
