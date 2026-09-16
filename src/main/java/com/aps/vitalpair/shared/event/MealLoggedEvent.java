package com.aps.vitalpair.shared.event;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Published when a meal is logged. Consumed by gamification, the feed and notifications.
 *
 * @param foodLogId the record this event came from, so a consumer that keeps a copy can find it
 *     again when the meal is deleted. The feed had no such link, and deleting a meal left its
 *     timeline item behind for the partner to keep reading.
 */
public record MealLoggedEvent(
        UUID userId,
        UUID tenantId,
        UUID foodLogId,
        LocalDate date,
        String foodName,
        String mealType,
        boolean isPrivate,
        int caloriesKcal,
        int proteinG,
        int carbG,
        int fatG) {}
