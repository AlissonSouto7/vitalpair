package com.aps.vitalpair.feed.infrastructure.persistence;

import com.aps.vitalpair.feed.domain.model.FeedReaction;
import org.mapstruct.Mapper;

@Mapper
public interface FeedReactionPersistenceMapper {

    FeedReactionJpaEntity toEntity(FeedReaction reaction);

    FeedReaction toDomain(FeedReactionJpaEntity entity);
}
