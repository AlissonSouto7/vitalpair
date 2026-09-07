package com.aps.vitalpair.pair.application.dto;

import java.util.UUID;

/** The basic data of one member of the pair. */
public record MemberView(UUID userId, String name, String email, String avatarUrl) {}
