package com.aps.vitalpair.ai.domain.model;

import com.aps.vitalpair.user.domain.model.Goal;

/**
 * The user's nutrition targets used to generate the meal plan. {@code dailyKcal} is required;
 * the macro targets and the goal may be null, and enter the prompt only when present.
 */
public record NutritionTargets(int dailyKcal, Integer proteinG, Integer carbG, Integer fatG, Goal goal) {}
