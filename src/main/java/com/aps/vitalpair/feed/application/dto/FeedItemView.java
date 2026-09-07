package com.aps.vitalpair.feed.application.dto;

import java.util.Map;
import java.util.Set;

import com.aps.vitalpair.feed.domain.model.FeedItem;
import com.aps.vitalpair.feed.domain.model.ReactionType;

/** A feed item with its reaction counts and the reactions of the caller. */
public record FeedItemView(FeedItem item, Map<ReactionType, Long> reactionCounts, Set<ReactionType> myReactions) {}
