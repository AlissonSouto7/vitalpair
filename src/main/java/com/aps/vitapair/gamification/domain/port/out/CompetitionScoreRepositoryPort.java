package com.aps.vitapair.gamification.domain.port.out;

import com.aps.vitapair.gamification.domain.model.CompetitionScore;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

public interface CompetitionScoreRepositoryPort {

    CompetitionScore save(CompetitionScore score);

    Optional<CompetitionScore> findByTenantAndWeek(UUID tenantId, LocalDate weekStart);
}
