package com.aps.vitalpair.season.infrastructure.persistence;

import com.aps.vitalpair.season.domain.model.PointEvent;
import org.mapstruct.Mapper;

@Mapper
public interface PointEventPersistenceMapper {

    PointEventJpaEntity toEntity(PointEvent event);

    PointEvent toDomain(PointEventJpaEntity entity);
}
