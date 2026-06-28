package com.aps.vitalpair.notification.infrastructure.persistence;

import com.aps.vitalpair.activity.infrastructure.persistence.ActivityLogJpaEntity;
import java.time.Instant;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * Contagens read-only de logs do dia para o lembrete (LOG_REMINDER). Bate direto nas entidades
 * de log de outras features, isolando por usuário e período, sem acoplar nas services delas.
 *
 * <p>Ancorado em {@link ActivityLogJpaEntity} apenas para registrar o repositório; cada query usa
 * o nome de entidade JPQL do log correspondente.
 */
public interface DailyLogMetricsJpaRepository extends JpaRepository<ActivityLogJpaEntity, UUID> {

    @Query("""
            SELECT COUNT(f)
            FROM FoodLogJpaEntity f
            WHERE f.userId = :userId
              AND f.loggedAt >= :start
              AND f.loggedAt < :end
            """)
    long countFoodLogs(
            @Param("userId") UUID userId,
            @Param("start") Instant start,
            @Param("end") Instant end);

    @Query("""
            SELECT COUNT(a)
            FROM ActivityLogJpaEntity a
            WHERE a.userId = :userId
              AND a.loggedAt >= :start
              AND a.loggedAt < :end
            """)
    long countActivityLogs(
            @Param("userId") UUID userId,
            @Param("start") Instant start,
            @Param("end") Instant end);
}
