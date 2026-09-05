package com.aps.vitalpair.ai.domain.port.in;

import java.util.UUID;

import com.aps.vitalpair.ai.application.dto.MealPlanView;

public interface GenerateMealPlanUseCase {

    /** Gera o cardápio da semana atual via IA, substituindo o plano existente (se houver). */
    MealPlanView generate(UUID userId);
}
