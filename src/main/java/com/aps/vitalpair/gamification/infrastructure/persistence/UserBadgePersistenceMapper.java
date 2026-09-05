package com.aps.vitalpair.gamification.infrastructure.persistence;

import org.mapstruct.Mapper;

import com.aps.vitalpair.gamification.domain.model.UserBadge;

@Mapper
public interface UserBadgePersistenceMapper {

    UserBadgeJpaEntity toEntity(UserBadge userBadge);

    UserBadge toDomain(UserBadgeJpaEntity entity);
}
