package com.aps.vitalpair.ai.domain.port.in;

import java.util.UUID;

import com.aps.vitalpair.ai.application.dto.MealPlanView;
import com.aps.vitalpair.ai.application.dto.SwapMealCommand;

public interface SwapMealUseCase {

    /** Asks the model for an alternative meal (same kcal and macro range) and replaces the plan item. */
    MealPlanView swap(UUID userId, UUID tenantId, SwapMealCommand command);
}
