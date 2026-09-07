package com.aps.vitalpair.notification.infrastructure.persistence;

import java.time.Instant;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.aps.vitalpair.activity.infrastructure.persistence.ActivityLogJpaEntity;

/**
 * Read-only counts of the day's logs for the reminder (LOG_REMINDER). Reads other features' log
 * entities directly, scoped by user and period, without depending on their services.
 *
 * <p>Anchored on {@link ActivityLogJpaEntity} only so the repository can be registered; each
 * query names the JPQL entity of the log it reads.
 */
public interface DailyLogMetricsJpaRepository extends JpaRepository<ActivityLogJpaEntity, UUID> {

    @Query(
            """
            SELECT COUNT(f)
            FROM FoodLogJpaEntity f
            WHERE f.userId = :userId
              AND f.loggedAt >= :start
              AND f.loggedAt < :end
            """)
    long countFoodLogs(@Param("userId") UUID userId, @Param("start") Instant start, @Param("end") Instant end);

    @Query(
            """
            SELECT COUNT(a)
            FROM ActivityLogJpaEntity a
            WHERE a.userId = :userId
              AND a.loggedAt >= :start
              AND a.loggedAt < :end
            """)
    long countActivityLogs(@Param("userId") UUID userId, @Param("start") Instant start, @Param("end") Instant end);
}
