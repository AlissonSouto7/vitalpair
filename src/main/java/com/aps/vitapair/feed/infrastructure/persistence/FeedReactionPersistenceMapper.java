package com.aps.vitapair.feed.infrastructure.persistence;

import com.aps.vitapair.feed.domain.model.FeedReaction;
import org.mapstruct.Mapper;

@Mapper
public interface FeedReactionPersistenceMapper {

    FeedReactionJpaEntity toEntity(FeedReaction reaction);

    FeedReaction toDomain(FeedReactionJpaEntity entity);
}
