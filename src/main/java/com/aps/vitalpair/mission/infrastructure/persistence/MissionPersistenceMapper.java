package com.aps.vitalpair.mission.infrastructure.persistence;

import com.aps.vitalpair.mission.domain.model.Mission;
import org.mapstruct.Mapper;

@Mapper
public interface MissionPersistenceMapper {

    Mission toDomain(MissionJpaEntity entity);
}
