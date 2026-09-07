package com.aps.vitalpair.ai.application.dto;

import com.aps.vitalpair.ai.domain.model.MealPlan;

/**
 * The meal plan ready to display: the week's plan plus the user's daily calorie target (null
 * while the profile has no target yet).
 */
public record MealPlanView(MealPlan plan, Integer targetKcal) {}
