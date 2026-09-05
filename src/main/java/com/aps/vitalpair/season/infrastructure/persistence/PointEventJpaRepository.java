package com.aps.vitalpair.season.infrastructure.persistence;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.aps.vitalpair.season.domain.port.out.projection.DayUserPoints;
import com.aps.vitalpair.season.domain.port.out.projection.SourceUserPoints;
import com.aps.vitalpair.season.domain.port.out.projection.UserPoints;

public interface PointEventJpaRepository extends JpaRepository<PointEventJpaEntity, UUID> {

    @Query(
            """
            SELECT new com.aps.vitalpair.season.domain.port.out.projection.UserPoints(
                p.userId, SUM(p.points))
            FROM PointEventJpaEntity p
            WHERE p.tenantId = :tenantId
              AND p.occurredAt >= :start
              AND p.occurredAt < :end
            GROUP BY p.userId
            """)
    List<UserPoints> sumByUser(
            @Param("tenantId") UUID tenantId, @Param("start") Instant start, @Param("end") Instant end);

    @Query(
            """
            SELECT new com.aps.vitalpair.season.domain.port.out.projection.DayUserPoints(
                CAST(p.occurredAt AS LocalDate), p.userId, SUM(p.points))
            FROM PointEventJpaEntity p
            WHERE p.tenantId = :tenantId
              AND p.occurredAt >= :start
              AND p.occurredAt < :end
            GROUP BY CAST(p.occurredAt AS LocalDate), p.userId
            """)
    List<DayUserPoints> sumByDayAndUser(
            @Param("tenantId") UUID tenantId, @Param("start") Instant start, @Param("end") Instant end);

    @Query(
            """
            SELECT new com.aps.vitalpair.season.domain.port.out.projection.SourceUserPoints(
                p.source, p.userId, SUM(p.points))
            FROM PointEventJpaEntity p
            WHERE p.tenantId = :tenantId
              AND p.occurredAt >= :start
              AND p.occurredAt < :end
            GROUP BY p.source, p.userId
            """)
    List<SourceUserPoints> sumBySourceAndUser(
            @Param("tenantId") UUID tenantId, @Param("start") Instant start, @Param("end") Instant end);
}
