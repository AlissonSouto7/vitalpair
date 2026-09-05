package com.aps.vitalpair.gamification.domain.port.out;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import com.aps.vitalpair.gamification.domain.model.CompetitionScore;

public interface CompetitionScoreRepositoryPort {

    CompetitionScore save(CompetitionScore score);

    Optional<CompetitionScore> findByTenantAndWeek(UUID tenantId, LocalDate weekStart);
}
