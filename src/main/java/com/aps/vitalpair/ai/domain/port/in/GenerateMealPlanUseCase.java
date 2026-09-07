package com.aps.vitalpair.ai.domain.port.in;

import java.util.UUID;

import com.aps.vitalpair.ai.application.dto.MealPlanView;

public interface GenerateMealPlanUseCase {

    /** Generates the current week's menu with the model, replacing any existing plan. */
    MealPlanView generate(UUID userId, UUID tenantId);
}
