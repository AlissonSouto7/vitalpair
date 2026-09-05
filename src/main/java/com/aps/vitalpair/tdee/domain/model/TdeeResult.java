package com.aps.vitalpair.tdee.domain.model;

/**
 * Resultado do cálculo energético.
 *
 * @param bmr                taxa metabólica basal (kcal)
 * @param tdee               gasto energético total diário de manutenção (kcal)
 * @param dailyCalorieTarget meta calórica diária conforme o objetivo (kcal)
 * @param proteinTargetG     meta de proteína (g)
 * @param carbTargetG        meta de carboidrato (g)
 * @param fatTargetG         meta de gordura (g)
 */
public record TdeeResult(
        int bmr, int tdee, int dailyCalorieTarget, int proteinTargetG, int carbTargetG, int fatTargetG) {}
