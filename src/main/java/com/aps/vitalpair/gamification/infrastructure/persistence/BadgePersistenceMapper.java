package com.aps.vitalpair.gamification.infrastructure.persistence;

import com.aps.vitalpair.gamification.domain.model.Badge;
import org.mapstruct.Mapper;

@Mapper
public interface BadgePersistenceMapper {

    Badge toDomain(BadgeJpaEntity entity);
}
