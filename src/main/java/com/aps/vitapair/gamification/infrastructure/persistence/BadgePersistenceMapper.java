package com.aps.vitapair.gamification.infrastructure.persistence;

import com.aps.vitapair.gamification.domain.model.Badge;
import org.mapstruct.Mapper;

@Mapper
public interface BadgePersistenceMapper {

    Badge toDomain(BadgeJpaEntity entity);
}
