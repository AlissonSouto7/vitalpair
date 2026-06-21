package com.aps.vitapair.feed.infrastructure.persistence;

import com.aps.vitapair.feed.domain.model.FeedItem;
import org.mapstruct.Mapper;

@Mapper
public interface FeedItemPersistenceMapper {

    FeedItemJpaEntity toEntity(FeedItem item);

    FeedItem toDomain(FeedItemJpaEntity entity);
}
