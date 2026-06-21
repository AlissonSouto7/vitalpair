package com.aps.vitapair.feed.domain.port.out;

import com.aps.vitapair.feed.domain.model.FeedReaction;
import com.aps.vitapair.feed.domain.model.ReactionType;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface FeedReactionRepositoryPort {

    FeedReaction save(FeedReaction reaction);

    boolean exists(UUID feedItemId, UUID userId, ReactionType type);

    void delete(UUID feedItemId, UUID userId, ReactionType type);

    List<FeedReaction> findByItemIds(Collection<UUID> feedItemIds);
}
