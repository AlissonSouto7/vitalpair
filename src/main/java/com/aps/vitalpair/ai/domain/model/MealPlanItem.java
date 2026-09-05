package com.aps.vitalpair.ai.domain.model;

import java.util.UUID;

/**
 * Uma refeição de um dia do plano alimentar ({@code dayIndex} 0 = segunda ... 6 = domingo).
 * Macros em valores inteiros, como o frontend consome.
 */
public record MealPlanItem(
        UUID id,
        int dayIndex,
        PlanMealType mealType,
        String name,
        int kcal,
        int proteinG,
        int carbG,
        int fatG) {
}
