package com.aps.vitalpair.mission.infrastructure.persistence;

import org.mapstruct.Mapper;

import com.aps.vitalpair.mission.domain.model.Mission;

@Mapper
public interface MissionPersistenceMapper {

    Mission toDomain(MissionJpaEntity entity);
}
