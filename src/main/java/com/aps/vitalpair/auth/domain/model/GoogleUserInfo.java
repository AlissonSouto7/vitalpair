package com.aps.vitalpair.auth.domain.model;

/** User data extracted from an already verified Google id_token. */
public record GoogleUserInfo(String email, String name, boolean emailVerified) {}
