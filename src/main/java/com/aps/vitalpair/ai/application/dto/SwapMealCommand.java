package com.aps.vitalpair.ai.application.dto;

import com.aps.vitalpair.ai.domain.model.PlanMealType;

/** A request to swap one meal of the current week's plan (day plus meal type). */
public record SwapMealCommand(int dayIndex, PlanMealType mealType) {}
