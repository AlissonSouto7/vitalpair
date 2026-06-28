package com.aps.vitalpair.mission.infrastructure.persistence;

import com.aps.vitalpair.mission.domain.model.WeeklyMission;
import com.aps.vitalpair.mission.domain.port.out.WeeklyMissionCatalogRepositoryPort;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class WeeklyMissionCatalogPersistenceAdapter implements WeeklyMissionCatalogRepositoryPort {

    private final WeeklyMissionJpaRepository repository;
    private final WeeklyMissionPersistenceMapper mapper;

    public WeeklyMissionCatalogPersistenceAdapter(
            WeeklyMissionJpaRepository repository, WeeklyMissionPersistenceMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    @Override
    public List<WeeklyMission> findAllOrdered() {
        return repository.findAllByOrderByDisplayOrderAsc().stream().map(mapper::toDomain).toList();
    }
}
