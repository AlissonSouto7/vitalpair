package com.aps.vitalpair.ai.domain.port.in;

import com.aps.vitalpair.ai.application.dto.MealPlanView;
import com.aps.vitalpair.ai.application.dto.SwapMealCommand;
import java.util.UUID;

public interface SwapMealUseCase {

    /** Pede à IA uma refeição alternativa (mesma faixa de kcal/macros) e substitui o item do plano. */
    MealPlanView swap(UUID userId, SwapMealCommand command);
}
