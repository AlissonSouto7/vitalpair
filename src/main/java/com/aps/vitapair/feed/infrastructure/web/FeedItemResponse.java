package com.aps.vitapair.feed.infrastructure.web;

import com.aps.vitapair.feed.domain.model.FeedItem;
import com.aps.vitapair.feed.domain.model.FeedItemType;
import java.time.Instant;
import java.util.UUID;

public record FeedItemResponse(
        UUID id,
        UUID userId,
        String actorName,
        FeedItemType type,
        String title,
        Instant createdAt) {

    public static FeedItemResponse from(FeedItem item) {
        return new FeedItemResponse(
                item.getId(), item.getUserId(), item.getActorName(),
                item.getType(), item.getTitle(), item.getCreatedAt());
    }
}
