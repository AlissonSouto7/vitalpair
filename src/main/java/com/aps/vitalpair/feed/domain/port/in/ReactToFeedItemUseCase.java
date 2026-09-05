package com.aps.vitalpair.feed.domain.port.in;

import java.util.UUID;

import com.aps.vitalpair.feed.domain.model.ReactionType;

public interface ReactToFeedItemUseCase {

    void react(UUID userId, UUID feedItemId, ReactionType type);

    void removeReaction(UUID userId, UUID feedItemId, ReactionType type);
}
