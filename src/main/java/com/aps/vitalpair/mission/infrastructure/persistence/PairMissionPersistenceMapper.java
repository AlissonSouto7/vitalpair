package com.aps.vitalpair.mission.infrastructure.persistence;

import com.aps.vitalpair.mission.domain.model.PairMissionState;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper
public interface PairMissionPersistenceMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "missionDate", source = "date")
    PairMissionJpaEntity toEntity(PairMissionState state);

    @Mapping(target = "date", source = "missionDate")
    PairMissionState toDomain(PairMissionJpaEntity entity);
}
