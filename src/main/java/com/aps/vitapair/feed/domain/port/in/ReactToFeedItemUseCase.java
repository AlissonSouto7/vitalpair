package com.aps.vitapair.feed.domain.port.in;

import com.aps.vitapair.feed.domain.model.ReactionType;
import java.util.UUID;

public interface ReactToFeedItemUseCase {

    void react(UUID userId, UUID feedItemId, ReactionType type);

    void removeReaction(UUID userId, UUID feedItemId, ReactionType type);
}
