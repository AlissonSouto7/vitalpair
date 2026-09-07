package com.aps.vitalpair.shared.event;

import java.time.LocalDate;
import java.util.UUID;

/** Published when a meal is logged. Consumed by gamification, the feed and notifications. */
public record MealLoggedEvent(
        UUID userId,
        UUID tenantId,
        LocalDate date,
        String foodName,
        String mealType,
        boolean isPrivate,
        int caloriesKcal,
        int proteinG,
        int carbG,
        int fatG) {}
