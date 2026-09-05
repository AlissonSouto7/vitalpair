package com.aps.vitalpair.feed.application.dto;

import java.util.Map;
import java.util.Set;

import com.aps.vitalpair.feed.domain.model.FeedItem;
import com.aps.vitalpair.feed.domain.model.ReactionType;

/** Item do feed com o resumo de reações e as reações do próprio usuário. */
public record FeedItemView(FeedItem item, Map<ReactionType, Long> reactionCounts, Set<ReactionType> myReactions) {}
