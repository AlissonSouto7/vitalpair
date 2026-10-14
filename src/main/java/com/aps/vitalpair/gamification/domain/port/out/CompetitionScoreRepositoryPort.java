package com.aps.vitalpair.gamification.domain.port.out;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.aps.vitalpair.gamification.domain.model.CompetitionScore;

public interface CompetitionScoreRepositoryPort {

    CompetitionScore save(CompetitionScore score);

    Optional<CompetitionScore> findByTenantAndWeek(UUID tenantId, LocalDate weekStart);

    /**
     * The weeks before {@code weekStart}, most recent first.
     *
     * <p>The table has been accumulating a row per week since the feature shipped and only
     * the current week was ever read, so every closed week was written and then ignored. The
     * limit is here rather than at the caller because the query is what has to be bounded.
     */
    List<CompetitionScore> findHistory(UUID tenantId, LocalDate before, int limit);
}
