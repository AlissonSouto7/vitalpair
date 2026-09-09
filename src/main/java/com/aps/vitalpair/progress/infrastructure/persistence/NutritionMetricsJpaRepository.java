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
     *
     * <p>Native rather than JPQL because the grouping has to happen in the user's zone, and JPQL
     * has no way to say that: {@code CAST(loggedAt AS LocalDate)} buckets by whatever zone the
     * database session is in. A meal logged at 21:00 in Brazil then landed in the next day's
     * bucket and the chart showed it on the wrong bar.
     *
     * <p>{@code :zone} is bound, not interpolated, so it cannot carry SQL. Postgres rejects an
     * unknown zone name with an error rather than silently choosing one.
     *
     * <p>Grouped and ordered by output position rather than by repeating the expression: each
     * {@code :zone} becomes its own placeholder, and Postgres does not treat two placeholders as
     * the same expression, so spelling it out again fails with "must appear in the GROUP BY
     * clause".
     */
    @Query(
            value =
                    """
            SELECT (f.logged_at AT TIME ZONE :zone)::date AS day,
                   SUM(f.calories_kcal) AS kcal,
                   SUM(f.protein_g) AS proteinG,
                   SUM(f.carb_g) AS carbG,
                   SUM(f.fat_g) AS fatG
            FROM food_logs f
            WHERE f.user_id = :userId
              AND f.logged_at >= :start
              AND f.logged_at < :end
            GROUP BY 1
            ORDER BY 1 ASC
            """,
            nativeQuery = true)
    List<DailyTotalsView> findDailyTotals(
            @Param("userId") UUID userId,
            @Param("start") Instant start,
            @Param("end") Instant end,
            @Param("zone") String zone);

    /** The projection of the totals summed per day. */
    interface DailyTotalsView {
        LocalDate getDay();

        java.math.BigDecimal getKcal();

        java.math.BigDecimal getProteinG();

        java.math.BigDecimal getCarbG();

        java.math.BigDecimal getFatG();
    }
}
