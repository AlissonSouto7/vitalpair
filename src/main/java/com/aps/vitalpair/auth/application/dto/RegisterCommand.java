package com.aps.vitalpair.auth.application.dto;

/** Dados de entrada do caso de uso de registro. */
public record RegisterCommand(String email, String password, String name) {}
