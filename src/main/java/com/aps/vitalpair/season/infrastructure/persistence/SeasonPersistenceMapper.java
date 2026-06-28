package com.aps.vitalpair.season.infrastructure.persistence;

import com.aps.vitalpair.season.domain.model.Season;
import org.mapstruct.Mapper;

@Mapper
public interface SeasonPersistenceMapper {

    SeasonJpaEntity toEntity(Season season);

    Season toDomain(SeasonJpaEntity entity);
}
