package com.aps.vitapair.gamification.infrastructure.persistence;

import com.aps.vitapair.gamification.domain.model.UserBadge;
import org.mapstruct.Mapper;

@Mapper
public interface UserBadgePersistenceMapper {

    UserBadgeJpaEntity toEntity(UserBadge userBadge);

    UserBadge toDomain(UserBadgeJpaEntity entity);
}
