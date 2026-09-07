package com.aps.vitalpair.progress.infrastructure.persistence;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.aps.vitalpair.nutrition.infrastructure.persistence.FoodLogJpaEntity;

/**
 * Read-only aggregates of {@code food_logs} for the Progress screen: calories and macros summed
 * per day. Reads the nutrition feature's log entity directly, without depending on its service
 * (the same pattern as {@code WeeklyMissionMetricsJpaRepository}).
 *
 * <p>Anchored on {@link FoodLogJpaEntity} only so the repository can be registered.
 */
public interface NutritionMetricsJpaRepository extends JpaRepository<FoodLogJpaEntity, UUID> {

    /**
     * The user's daily calorie and macro totals within {@code [start, end)}. One row per day that
     * has a meal.
     */
    @Query(
            """
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
            @Param("userId") UUID userId, @Param("start") Instant start, @Param("end") Instant end);

    /** The projection of the totals summed per day. */
    interface DailyTotalsView {
        LocalDate getDay();

        java.math.BigDecimal getKcal();

        java.math.BigDecimal getProteinG();

        java.math.BigDecimal getCarbG();

        java.math.BigDecimal getFatG();
    }
}
