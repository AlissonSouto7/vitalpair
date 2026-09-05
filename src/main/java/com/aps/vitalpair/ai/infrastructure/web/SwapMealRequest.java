package com.aps.vitalpair.ai.infrastructure.web;

import com.aps.vitalpair.ai.domain.model.PlanMealType;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/** Corpo do POST /api/v1/meal-plan/swap: qual refeição de qual dia trocar. */
public record SwapMealRequest(
        @NotNull(message = "dayIndex é obrigatório")
        @Min(value = 0, message = "dayIndex deve estar entre 0 e 6")
        @Max(value = 6, message = "dayIndex deve estar entre 0 e 6")
        Integer dayIndex,

        @NotNull(message = "mealType é obrigatório")
        PlanMealType mealType) {
}
