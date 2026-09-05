package com.aps.vitalpair.ai.domain.port.in;

import java.util.Optional;
import java.util.UUID;

import com.aps.vitalpair.ai.application.dto.MealPlanView;

public interface GetMealPlanUseCase {

    /** Plano alimentar da semana atual (segunda a domingo); vazio se ainda não foi gerado. */
    Optional<MealPlanView> getCurrentWeekPlan(UUID userId);
}
