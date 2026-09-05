package com.aps.vitalpair.gamification.infrastructure.persistence;

import org.mapstruct.Mapper;

import com.aps.vitalpair.gamification.domain.model.UserStreak;

@Mapper
public interface UserStreakPersistenceMapper {

    UserStreakJpaEntity toEntity(UserStreak streak);

    UserStreak toDomain(UserStreakJpaEntity entity);
}
