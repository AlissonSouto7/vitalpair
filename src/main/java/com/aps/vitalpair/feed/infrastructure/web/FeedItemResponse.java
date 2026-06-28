package com.aps.vitalpair.feed.infrastructure.web;

import com.aps.vitalpair.feed.application.dto.FeedItemView;
import com.aps.vitalpair.feed.domain.model.FeedItem;
import com.aps.vitalpair.feed.domain.model.FeedItemType;
import com.aps.vitalpair.feed.domain.model.ReactionType;
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
        String subtitle,
        int points,
        boolean isPrivate,
        Instant createdAt,
        Map<ReactionType, Long> reactionCounts,
        Set<ReactionType> myReactions) {

    public static FeedItemResponse from(FeedItemView view) {
        FeedItem item = view.item();
        return new FeedItemResponse(
                item.getId(), item.getUserId(), item.getActorName(), item.getType(), item.getTitle(),
                item.getSubtitle(), item.getPoints(), item.isPrivate(), item.getCreatedAt(),
                view.reactionCounts(), view.myReactions());
    }
}
