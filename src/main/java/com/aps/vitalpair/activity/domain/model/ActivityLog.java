package com.aps.vitalpair.activity.domain.model;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import lombok.Builder;
import lombok.Getter;

/** Registro de uma atividade física. Imutável. */
@Getter
@Builder(toBuilder = true)
public class ActivityLog {

    private final UUID id;
    private final UUID tenantId;
    private final UUID userId;
    private final ActivityType activityType;
    private final Integer steps;
    private final BigDecimal distanceKm;
    private final BigDecimal caloriesBurned;
    private final Integer durationMinutes;
    private final ActivitySource source;
    private final String externalId;
    private final Instant loggedAt;
}
