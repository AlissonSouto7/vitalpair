package com.aps.vitapair.shared.event;

import java.time.LocalDate;
import java.util.UUID;

/** Publicado quando uma refeição é registrada. Consumido por gamificação e feed. */
public record MealLoggedEvent(
        UUID userId,
        UUID tenantId,
        LocalDate date,
        String foodName,
        String mealType) {
}
