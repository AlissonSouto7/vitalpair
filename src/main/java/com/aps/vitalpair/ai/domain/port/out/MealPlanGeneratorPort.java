package com.aps.vitalpair.ai.domain.port.out;

import java.util.List;

import com.aps.vitalpair.ai.domain.model.MealPlanItem;
import com.aps.vitalpair.ai.domain.model.NutritionTargets;

/** Porta de saída para a IA que monta o cardápio (implementada sobre a Anthropic). */
public interface MealPlanGeneratorPort {

    /** Gera a semana inteira: 7 dias x 4 refeições alinhadas às metas do usuário. */
    List<MealPlanItem> generateWeek(NutritionTargets targets);

    /**
     * Gera UMA refeição alternativa ao item atual: prato diferente, mesma faixa de kcal/macros.
     * O retorno preserva {@code dayIndex} e {@code mealType} do item atual.
     */
    MealPlanItem generateAlternative(MealPlanItem current);
}
