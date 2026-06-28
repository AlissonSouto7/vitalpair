package com.aps.vitalpair.feed.domain.port.in;

import com.aps.vitalpair.feed.domain.model.ReactionType;
import java.util.UUID;

public interface ReactToFeedItemUseCase {

    void react(UUID userId, UUID feedItemId, ReactionType type);

    void removeReaction(UUID userId, UUID feedItemId, ReactionType type);
}
