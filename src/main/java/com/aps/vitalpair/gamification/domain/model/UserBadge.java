package com.aps.vitalpair.gamification.domain.model;

import java.time.Instant;
import java.util.UUID;

import lombok.Builder;
import lombok.Getter;

/** Conquista obtida por um usuário. Imutável. */
@Getter
@Builder(toBuilder = true)
public class UserBadge {

    private final UUID id;
    private final UUID tenantId;
    private final UUID userId;
    private final UUID badgeId;
    private final Instant earnedAt;
}
