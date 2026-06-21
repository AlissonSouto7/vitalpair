package com.aps.vitapair.feed.infrastructure.persistence;

import com.aps.vitapair.feed.domain.model.FeedItem;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper
public interface FeedItemPersistenceMapper {

    // Lombok gera getter isPrivate() (propriedade "private"), mas o builder espera "isPrivate".
    @Mapping(target = "isPrivate", source = "private")
    FeedItemJpaEntity toEntity(FeedItem item);

    @Mapping(target = "isPrivate", source = "private")
    FeedItem toDomain(FeedItemJpaEntity entity);
}
