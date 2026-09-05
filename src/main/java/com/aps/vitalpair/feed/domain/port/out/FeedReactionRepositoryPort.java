package com.aps.vitalpair.feed.domain.port.out;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

import com.aps.vitalpair.feed.domain.model.FeedReaction;
import com.aps.vitalpair.feed.domain.model.ReactionType;

public interface FeedReactionRepositoryPort {

    FeedReaction save(FeedReaction reaction);

    boolean exists(UUID feedItemId, UUID userId, ReactionType type);

    void delete(UUID feedItemId, UUID userId, ReactionType type);

    List<FeedReaction> findByItemIds(Collection<UUID> feedItemIds);
}
