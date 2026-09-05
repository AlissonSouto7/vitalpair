package com.aps.vitalpair.mission.infrastructure.persistence;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Component;

import com.aps.vitalpair.mission.domain.model.Mission;
import com.aps.vitalpair.mission.domain.model.MissionKind;
import com.aps.vitalpair.mission.domain.port.out.MissionCatalogRepositoryPort;

@Component
public class MissionCatalogPersistenceAdapter implements MissionCatalogRepositoryPort {

    private final MissionJpaRepository repository;
    private final MissionPersistenceMapper mapper;

    public MissionCatalogPersistenceAdapter(MissionJpaRepository repository, MissionPersistenceMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    @Override
    public List<Mission> findByKind(MissionKind kind) {
        return repository.findByKindOrderByCodeAsc(kind).stream()
                .map(mapper::toDomain)
                .toList();
    }

    @Override
    public Optional<Mission> findByCode(String code) {
        return repository.findByCode(code).map(mapper::toDomain);
    }
}
