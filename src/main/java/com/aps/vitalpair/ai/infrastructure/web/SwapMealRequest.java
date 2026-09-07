package com.aps.vitalpair.ai.infrastructure.web;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import com.aps.vitalpair.ai.domain.model.PlanMealType;

/** Body of POST /api/v1/meal-plan/swap: which meal of which day to swap. */
public record SwapMealRequest(
        @NotNull(message = "dayIndex é obrigatório")
                @Min(value = 0, message = "dayIndex deve estar entre 0 e 6")
                @Max(value = 6, message = "dayIndex deve estar entre 0 e 6")
                Integer dayIndex,
        @NotNull(message = "mealType é obrigatório") PlanMealType mealType) {}
