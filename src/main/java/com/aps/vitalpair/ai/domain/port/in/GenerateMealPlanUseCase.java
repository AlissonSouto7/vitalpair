package com.aps.vitalpair.ai.domain.port.in;

import com.aps.vitalpair.ai.application.dto.MealPlanView;
import java.util.UUID;

public interface GenerateMealPlanUseCase {

    /** Gera o cardápio da semana atual via IA, substituindo o plano existente (se houver). */
    MealPlanView generate(UUID userId);
}
