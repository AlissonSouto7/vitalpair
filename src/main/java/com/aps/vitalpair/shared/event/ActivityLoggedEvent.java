package com.aps.vitalpair.shared.event;

import java.time.LocalDate;
import java.util.UUID;

/** Publicado quando uma atividade física é registrada. Consumido por gamificação e feed. */
public record ActivityLoggedEvent(
        UUID userId, UUID tenantId, LocalDate date, String activityType, int caloriesBurned, Integer durationMinutes) {}
