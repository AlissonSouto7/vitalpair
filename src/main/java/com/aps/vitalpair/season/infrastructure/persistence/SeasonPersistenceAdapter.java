package com.aps.vitalpair.season.infrastructure.persistence;

import com.aps.vitalpair.season.domain.model.Season;
import com.aps.vitalpair.season.domain.model.SeasonStatus;
import com.aps.vitalpair.season.domain.port.out.SeasonRepositoryPort;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Component;

@Component
public class SeasonPersistenceAdapter implements SeasonRepositoryPort {

    private final SeasonJpaRepository repository;
    private final SeasonPersistenceMapper mapper;

    public SeasonPersistenceAdapter(SeasonJpaRepository repository, SeasonPersistenceMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    @Override
    public Season save(Season season) {
        return mapper.toDomain(repository.save(mapper.toEntity(season)));
    }

    @Override
    public Optional<Season> findActiveByTenant(UUID tenantId) {
        return repository.findByTenantIdAndStatus(tenantId, SeasonStatus.ACTIVE).map(mapper::toDomain);
    }

    @Override
    public List<Season> findByTenantAndStatusOrderByNumberDesc(UUID tenantId, SeasonStatus status) {
        return repository.findByTenantIdAndStatusOrderByNumberDesc(tenantId, status).stream()
                .map(mapper::toDomain)
                .toList();
    }
}
