package com.aps.vitapair.dashboard.application.dto;

/**
 * Progresso do dia de um usuário: consumido (nutrição) vs gasto (atividade) vs meta.
 *
 * @param netCalories       consumido - gasto
 * @param remainingCalories meta - net (positivo = ainda pode comer; negativo = passou da meta)
 */
public record DayProgress(
        Integer calorieTarget,
        int consumedCalories,
        int burnedCalories,
        int netCalories,
        Integer remainingCalories,
        int consumedProteinG,
        int consumedCarbG,
        int consumedFatG,
        Integer proteinTargetG,
        Integer carbTargetG,
        Integer fatTargetG,
        int steps,
        int mealCount) {
}
