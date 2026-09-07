package com.aps.vitalpair.shared.event;

import java.time.LocalDate;
import java.util.UUID;

/** Published when a physical activity is logged. Consumed by gamification, the feed and notifications. */
public record ActivityLoggedEvent(
        UUID userId, UUID tenantId, LocalDate date, String activityType, int caloriesBurned, Integer durationMinutes) {}
