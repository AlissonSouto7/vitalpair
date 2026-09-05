package com.aps.vitalpair.feed.infrastructure.persistence;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import com.aps.vitalpair.feed.domain.model.ReactionType;

public interface FeedReactionJpaRepository extends JpaRepository<FeedReactionJpaEntity, UUID> {

    boolean existsByFeedItemIdAndUserIdAndType(UUID feedItemId, UUID userId, ReactionType type);

    @Transactional
    void deleteByFeedItemIdAndUserIdAndType(UUID feedItemId, UUID userId, ReactionType type);

    List<FeedReactionJpaEntity> findByFeedItemIdIn(Collection<UUID> feedItemIds);
}
