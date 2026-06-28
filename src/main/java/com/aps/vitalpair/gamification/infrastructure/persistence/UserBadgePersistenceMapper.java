package com.aps.vitalpair.gamification.infrastructure.persistence;

import com.aps.vitalpair.gamification.domain.model.UserBadge;
import org.mapstruct.Mapper;

@Mapper
public interface UserBadgePersistenceMapper {

    UserBadgeJpaEntity toEntity(UserBadge userBadge);

    UserBadge toDomain(UserBadgeJpaEntity entity);
}
