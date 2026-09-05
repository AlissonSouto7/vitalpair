package com.aps.vitalpair.feed.infrastructure.persistence;

import org.mapstruct.Mapper;

import com.aps.vitalpair.feed.domain.model.FeedReaction;

@Mapper
public interface FeedReactionPersistenceMapper {

    FeedReactionJpaEntity toEntity(FeedReaction reaction);

    FeedReaction toDomain(FeedReactionJpaEntity entity);
}
