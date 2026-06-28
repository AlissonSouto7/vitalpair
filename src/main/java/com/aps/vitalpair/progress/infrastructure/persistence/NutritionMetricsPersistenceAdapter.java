package com.aps.vitalpair.progress.infrastructure.persistence;

import com.aps.vitalpair.progress.domain.model.DailyNutritionTotals;
import com.aps.vitalpair.progress.domain.port.out.NutritionMetricsPort;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Component;

@Component
public class NutritionMetricsPersistenceAdapter implements NutritionMetricsPort {

    private final NutritionMetricsJpaRepository repository;

    public NutritionMetricsPersistenceAdapter(NutritionMetricsJpaRepository repository) {
        this.repository = repository;
    }

    @Override
    public List<DailyNutritionTotals> findDailyTotals(UUID userId, LocalDate from, LocalDate to) {
        Instant start = from.atStartOfDay(ZoneOffset.UTC).toInstant();
        Instant end = to.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant();
        return repository.findDailyTotals(userId, start, end).stream()
                .map(view -> new DailyNutritionTotals(
                        view.getDay(),
                        round(view.getKcal()),
                        round(view.getProteinG()),
                        round(view.getCarbG()),
                        round(view.getFatG())))
                .toList();
    }

    private static int round(BigDecimal value) {
        return value != null ? value.setScale(0, RoundingMode.HALF_UP).intValue() : 0;
    }
}
