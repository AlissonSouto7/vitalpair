package com.aps.vitalpair.ai.domain.port.in;

import java.util.Optional;
import java.util.UUID;

import com.aps.vitalpair.ai.application.dto.MealPlanView;

public interface GetMealPlanUseCase {

    /** The current week's meal plan (Monday to Sunday); empty when not generated yet. */
    Optional<MealPlanView> getCurrentWeekPlan(UUID userId, UUID tenantId);
}
