package com.aps.vitalpair.gamification.infrastructure.persistence;

import org.mapstruct.Mapper;

import com.aps.vitalpair.gamification.domain.model.Badge;

@Mapper
public interface BadgePersistenceMapper {

    Badge toDomain(BadgeJpaEntity entity);
}
