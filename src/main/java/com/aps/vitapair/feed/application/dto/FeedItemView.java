package com.aps.vitapair.feed.application.dto;

import com.aps.vitapair.feed.domain.model.FeedItem;
import com.aps.vitapair.feed.domain.model.ReactionType;
import java.util.Map;
import java.util.Set;

/** Item do feed com o resumo de reações e as reações do próprio usuário. */
public record FeedItemView(
        FeedItem item,
        Map<ReactionType, Long> reactionCounts,
        Set<ReactionType> myReactions) {
}
