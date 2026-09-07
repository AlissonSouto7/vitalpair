package com.aps.vitalpair.feed.domain.model;

import java.time.Instant;
import java.util.UUID;

import lombok.Builder;
import lombok.Getter;

/** A user's reaction to a feed item. Immutable. */
@Getter
@Builder(toBuilder = true)
public class FeedReaction {

    private final UUID id;
    private final UUID feedItemId;
    private final UUID userId;
    private final ReactionType type;
    private final Instant createdAt;
}
