package com.aps.vitalpair.gamification.infrastructure.persistence;

import com.aps.vitalpair.gamification.domain.model.CompetitionScore;
import com.aps.vitalpair.gamification.domain.port.out.CompetitionScoreRepositoryPort;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Component;

@Component
public class CompetitionScorePersistenceAdapter implements CompetitionScoreRepositoryPort {

    private final CompetitionScoreJpaRepository repository;
    private final CompetitionScorePersistenceMapper mapper;

    public CompetitionScorePersistenceAdapter(
            CompetitionScoreJpaRepository repository, CompetitionScorePersistenceMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    @Override
    public CompetitionScore save(CompetitionScore score) {
        return mapper.toDomain(repository.save(mapper.toEntity(score)));
    }

    @Override
    public Optional<CompetitionScore> findByTenantAndWeek(UUID tenantId, LocalDate weekStart) {
        return repository.findByTenantIdAndWeekStart(tenantId, weekStart).map(mapper::toDomain);
    }
}
