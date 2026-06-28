package com.aps.vitalpair.gamification.infrastructure.persistence;

import com.aps.vitalpair.gamification.domain.model.UserStreak;
import org.mapstruct.Mapper;

@Mapper
public interface UserStreakPersistenceMapper {

    UserStreakJpaEntity toEntity(UserStreak streak);

    UserStreak toDomain(UserStreakJpaEntity entity);
}
