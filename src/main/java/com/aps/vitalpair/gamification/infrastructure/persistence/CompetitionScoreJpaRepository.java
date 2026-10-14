package com.aps.vitalpair.gamification.infrastructure.persistence;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CompetitionScoreJpaRepository extends JpaRepository<CompetitionScoreJpaEntity, UUID> {

    Optional<CompetitionScoreJpaEntity> findByTenantIdAndWeekStart(UUID tenantId, LocalDate weekStart);

    /** The closed weeks, most recent first. Bounded through {@link Pageable}. */
    List<CompetitionScoreJpaEntity> findByTenantIdAndWeekStartLessThanOrderByWeekStartDesc(
            UUID tenantId, LocalDate weekStart, Pageable pageable);
}
