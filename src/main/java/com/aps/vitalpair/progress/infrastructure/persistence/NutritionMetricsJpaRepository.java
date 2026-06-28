package com.aps.vitalpair.progress.infrastructure.persistence;

import com.aps.vitalpair.nutrition.infrastructure.persistence.FoodLogJpaEntity;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * Agregados read-only de {@code food_logs} para a tela de Progresso: calorias e
 * macros somados por dia. Bate direto na entidade de log da feature nutrition,
 * sem acoplar na service dela (mesmo padrão de
 * {@code WeeklyMissionMetricsJpaRepository}).
 *
 * <p>Ancorado em {@link FoodLogJpaEntity} apenas para registrar o repositório.
 */
public interface NutritionMetricsJpaRepository extends JpaRepository<FoodLogJpaEntity, UUID> {

    /**
     * Totais diários de calorias e macros do usuário no intervalo
     * {@code [start, end)}. Um registro por dia que tem refeição.
     */
    @Query("""
            SELECT CAST(f.loggedAt AS LocalDate) AS day,
                   SUM(f.caloriesKcal) AS kcal,
                   SUM(f.proteinG) AS proteinG,
                   SUM(f.carbG) AS carbG,
                   SUM(f.fatG) AS fatG
            FROM FoodLogJpaEntity f
            WHERE f.userId = :userId
              AND f.loggedAt >= :start
              AND f.loggedAt < :end
            GROUP BY CAST(f.loggedAt AS LocalDate)
            ORDER BY CAST(f.loggedAt AS LocalDate) ASC
            """)
    List<DailyTotalsView> findDailyTotals(
            @Param("userId") UUID userId,
            @Param("start") Instant start,
            @Param("end") Instant end);

    /** Projeção dos totais somados por dia. */
    interface DailyTotalsView {
        LocalDate getDay();

        java.math.BigDecimal getKcal();

        java.math.BigDecimal getProteinG();

        java.math.BigDecimal getCarbG();

        java.math.BigDecimal getFatG();
    }
}
