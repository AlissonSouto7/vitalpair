package com.aps.vitalpair.mission.infrastructure.persistence;

import java.time.Instant;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.aps.vitalpair.activity.infrastructure.persistence.ActivityLogJpaEntity;

/**
 * Read-only counts that feed weekly mission progress. Reads other features' log entities
 * directly, always scoped by user and period, without depending on the nutrition or activity
 * services.
 *
 * <p>Anchored on {@link ActivityLogJpaEntity} only so the repository can be registered; each
 * query names the JPQL entity of the log it reads.
 */
public interface WeeklyMissionMetricsJpaRepository extends JpaRepository<ActivityLogJpaEntity, UUID> {

    /** Distinct days with at least one meal logged within the period. */
    @Query(
            """
            SELECT COUNT(DISTINCT CAST(f.loggedAt AS LocalDate))
            FROM FoodLogJpaEntity f
            WHERE f.userId = :userId
              AND f.loggedAt >= :start
              AND f.loggedAt < :end
            """)
    long countMealDays(@Param("userId") UUID userId, @Param("start") Instant start, @Param("end") Instant end);

    /** The user's activities within the period whose type is not STEPS. */
    @Query(
            """
            SELECT COUNT(a)
            FROM ActivityLogJpaEntity a
            WHERE a.userId = :userId
              AND a.loggedAt >= :start
              AND a.loggedAt < :end
              AND a.activityType <> com.aps.vitalpair.activity.domain.model.ActivityType.STEPS
            """)
    long countWorkouts(@Param("userId") UUID userId, @Param("start") Instant start, @Param("end") Instant end);
}
