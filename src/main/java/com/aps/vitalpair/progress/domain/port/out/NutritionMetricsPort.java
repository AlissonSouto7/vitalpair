package com.aps.vitalpair.progress.domain.port.out;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import com.aps.vitalpair.progress.domain.model.DailyNutritionTotals;

/**
 * Porta de saída read-only para os agregados de {@code food_logs} (calorias e
 * macros somados por dia), sem acoplar na service de nutrition.
 */
public interface NutritionMetricsPort {

    /**
     * Totais diários de calorias e macros do usuário no intervalo
     * {@code [from, to]} (inclusivo nas duas pontas). Apenas dias com registro
     * aparecem; dias sem refeição ficam de fora e são tratados como zero pela
     * camada de aplicação.
     */
    List<DailyNutritionTotals> findDailyTotals(UUID userId, LocalDate from, LocalDate to);
}
