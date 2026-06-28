package com.aps.vitalpair.gamification.infrastructure.persistence;

import com.aps.vitalpair.gamification.domain.model.CompetitionScore;
import org.mapstruct.Mapper;

@Mapper
public interface CompetitionScorePersistenceMapper {

    CompetitionScoreJpaEntity toEntity(CompetitionScore score);

    CompetitionScore toDomain(CompetitionScoreJpaEntity entity);
}
