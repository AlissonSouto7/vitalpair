package com.aps.vitapair.gamification.infrastructure.persistence;

import com.aps.vitapair.gamification.domain.model.UserStreak;
import org.mapstruct.Mapper;

@Mapper
public interface UserStreakPersistenceMapper {

    UserStreakJpaEntity toEntity(UserStreak streak);

    UserStreak toDomain(UserStreakJpaEntity entity);
}
