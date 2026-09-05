package com.aps.vitalpair.pair.application.dto;

import java.util.UUID;

/** Dados básicos de um membro do par. */
public record MemberView(UUID userId, String name, String email, String avatarUrl) {}
