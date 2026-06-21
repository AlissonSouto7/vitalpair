package com.aps.vitapair.feed.infrastructure.web;

import com.aps.vitapair.feed.application.dto.FeedItemView;
import com.aps.vitapair.feed.domain.model.FeedItem;
import com.aps.vitapair.feed.domain.model.FeedItemType;
import com.aps.vitapair.feed.domain.model.ReactionType;
import java.time.Instant;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

public record FeedItemResponse(
        UUID id,
        UUID userId,
        String actorName,
        FeedItemType type,
        String title,
        boolean isPrivate,
        Instant createdAt,
        Map<ReactionType, Long> reactionCounts,
        Set<ReactionType> myReactions) {

    public static FeedItemResponse from(FeedItemView view) {
        FeedItem item = view.item();
        return new FeedItemResponse(
                item.getId(), item.getUserId(), item.getActorName(), item.getType(), item.getTitle(),
                item.isPrivate(), item.getCreatedAt(), view.reactionCounts(), view.myReactions());
    }
}
