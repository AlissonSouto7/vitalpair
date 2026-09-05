package com.aps.vitalpair.gamification.infrastructure.persistence;

import org.mapstruct.Mapper;

import com.aps.vitalpair.gamification.domain.model.CompetitionScore;

@Mapper
public interface CompetitionScorePersistenceMapper {

    CompetitionScoreJpaEntity toEntity(CompetitionScore score);

    CompetitionScore toDomain(CompetitionScoreJpaEntity entity);
}
