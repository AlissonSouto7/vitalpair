package com.aps.vitalpair.mission.infrastructure.persistence;

import java.time.Instant;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.aps.vitalpair.activity.infrastructure.persistence.ActivityLogJpaEntity;

/**
 * Contagens read-only que alimentam o progresso das missões semanais. Bate
 * direto nas entidades de log de outras features, sempre isolando por usuário e
 * período, sem acoplar nas services de nutrition/activity.
 *
 * <p>Ancorado em {@link ActivityLogJpaEntity} apenas para registrar o repositório;
 * as queries usam o nome de entidade JPQL de cada log.
 */
public interface WeeklyMissionMetricsJpaRepository extends JpaRepository<ActivityLogJpaEntity, UUID> {

    /** Dias distintos com ao menos uma refeição registrada no período. */
    @Query(
            """
            SELECT COUNT(DISTINCT CAST(f.loggedAt AS LocalDate))
            FROM FoodLogJpaEntity f
            WHERE f.userId = :userId
              AND f.loggedAt >= :start
              AND f.loggedAt < :end
            """)
    long countMealDays(@Param("userId") UUID userId, @Param("start") Instant start, @Param("end") Instant end);

    /** Atividades do usuário no período cujo tipo não seja STEPS. */
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
