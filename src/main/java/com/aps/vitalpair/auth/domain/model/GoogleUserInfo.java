package com.aps.vitalpair.auth.domain.model;

/** Dados do usuário extraídos de um id_token do Google já verificado. */
public record GoogleUserInfo(String email, String name, boolean emailVerified) {}
