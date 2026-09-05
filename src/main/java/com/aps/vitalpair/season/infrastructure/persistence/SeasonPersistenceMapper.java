package com.aps.vitalpair.season.infrastructure.persistence;

import org.mapstruct.Mapper;

import com.aps.vitalpair.season.domain.model.Season;

@Mapper
public interface SeasonPersistenceMapper {

    SeasonJpaEntity toEntity(Season season);

    Season toDomain(SeasonJpaEntity entity);
}
