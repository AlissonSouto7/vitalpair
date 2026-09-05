package com.aps.vitalpair.ai.domain.port.in;

import com.aps.vitalpair.ai.application.dto.MealPlanView;
import java.util.Optional;
import java.util.UUID;

public interface GetMealPlanUseCase {

    /** Plano alimentar da semana atual (segunda a domingo); vazio se ainda não foi gerado. */
    Optional<MealPlanView> getCurrentWeekPlan(UUID userId);
}
