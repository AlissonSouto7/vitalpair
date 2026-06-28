package com.aps.vitalpair.progress.domain.model;

import java.time.LocalDate;

/**
 * Totais diários agregados de food_logs (um por dia com registro). Soma das
 * calorias e dos macros consumidos no dia. Usado para montar o gráfico de
 * calorias e as médias de macros.
 *
 * @param date     dia do registro
 * @param kcal     total de calorias consumidas no dia
 * @param proteinG total de proteína (g) no dia
 * @param carbG    total de carboidrato (g) no dia
 * @param fatG     total de gordura (g) no dia
 */
public record DailyNutritionTotals(LocalDate date, int kcal, int proteinG, int carbG, int fatG) {
}
