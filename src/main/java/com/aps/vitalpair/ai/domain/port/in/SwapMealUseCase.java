package com.aps.vitalpair.ai.domain.port.in;

import java.util.UUID;

import com.aps.vitalpair.ai.application.dto.MealPlanView;
import com.aps.vitalpair.ai.application.dto.SwapMealCommand;

public interface SwapMealUseCase {

    /** Pede à IA uma refeição alternativa (mesma faixa de kcal/macros) e substitui o item do plano. */
    MealPlanView swap(UUID userId, SwapMealCommand command);
}
