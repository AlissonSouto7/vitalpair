package com.aps.vitalpair.progress.domain.port.out;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import com.aps.vitalpair.progress.domain.model.DailyNutritionTotals;

/**
 * Read-only outbound port for the aggregates of {@code food_logs} (calories and macros summed
 * per day), without depending on the nutrition service.
 */
public interface NutritionMetricsPort {

    /**
     * The user's daily calorie and macro totals within {@code [from, to]}, inclusive at both ends.
     * Only days with records appear; days without a meal are absent and treated as zero by the
     * application layer.
     */
    List<DailyNutritionTotals> findDailyTotals(UUID userId, LocalDate from, LocalDate to);
}
