package com.aps.vitalpair.season.infrastructure.persistence;

import org.mapstruct.Mapper;

import com.aps.vitalpair.season.domain.model.PointEvent;

@Mapper
public interface PointEventPersistenceMapper {

    PointEventJpaEntity toEntity(PointEvent event);

    PointEvent toDomain(PointEventJpaEntity entity);
}
