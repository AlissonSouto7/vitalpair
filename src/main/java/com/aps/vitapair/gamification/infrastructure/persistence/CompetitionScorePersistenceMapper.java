package com.aps.vitapair.gamification.infrastructure.persistence;

import com.aps.vitapair.gamification.domain.model.CompetitionScore;
import org.mapstruct.Mapper;

@Mapper
public interface CompetitionScorePersistenceMapper {

    CompetitionScoreJpaEntity toEntity(CompetitionScore score);

    CompetitionScore toDomain(CompetitionScoreJpaEntity entity);
}
