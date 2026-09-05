package com.aps.vitalpair.mission.infrastructure.persistence;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Component;

import com.aps.vitalpair.mission.domain.model.PairMissionState;
import com.aps.vitalpair.mission.domain.port.out.PairMissionRepositoryPort;

@Component
public class PairMissionPersistenceAdapter implements PairMissionRepositoryPort {

    private final PairMissionJpaRepository repository;
    private final PairMissionPersistenceMapper mapper;

    public PairMissionPersistenceAdapter(PairMissionJpaRepository repository, PairMissionPersistenceMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    @Override
    public Optional<PairMissionState> find(UUID tenantId, LocalDate date) {
        return repository.findByTenantIdAndMissionDate(tenantId, date).map(mapper::toDomain);
    }

    @Override
    public PairMissionState save(PairMissionState state) {
        PairMissionJpaEntity entity = mapper.toEntity(state);
        // Preserva o id da linha existente (UNIQUE tenant_id + mission_date) para fazer upsert.
        repository
                .findByTenantIdAndMissionDate(state.getTenantId(), state.getDate())
                .ifPresent(existing -> entity.setId(existing.getId()));
        return mapper.toDomain(repository.save(entity));
    }
}
