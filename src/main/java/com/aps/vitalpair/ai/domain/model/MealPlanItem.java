package com.aps.vitalpair.ai.domain.model;

import java.util.UUID;

/**
 * One meal of one day of the meal plan ({@code dayIndex} 0 = Monday ... 6 = Sunday). Macros are
 * whole numbers, which is what the frontend consumes.
 */
public record MealPlanItem(
        UUID id, int dayIndex, PlanMealType mealType, String name, int kcal, int proteinG, int carbG, int fatG) {}
