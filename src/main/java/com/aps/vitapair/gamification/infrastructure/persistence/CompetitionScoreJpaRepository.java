package com.aps.vitapair.gamification.infrastructure.persistence;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CompetitionScoreJpaRepository extends JpaRepository<CompetitionScoreJpaEntity, UUID> {

    Optional<CompetitionScoreJpaEntity> findByTenantIdAndWeekStart(UUID tenantId, LocalDate weekStart);
}
