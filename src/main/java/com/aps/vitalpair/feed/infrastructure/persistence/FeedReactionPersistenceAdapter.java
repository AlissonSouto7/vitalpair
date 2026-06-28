package com.aps.vitalpair.feed.infrastructure.persistence;

import com.aps.vitalpair.feed.domain.model.FeedReaction;
import com.aps.vitalpair.feed.domain.model.ReactionType;
import com.aps.vitalpair.feed.domain.port.out.FeedReactionRepositoryPort;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Component;

@Component
public class FeedReactionPersistenceAdapter implements FeedReactionRepositoryPort {

    private final FeedReactionJpaRepository repository;
    private final FeedReactionPersistenceMapper mapper;

    public FeedReactionPersistenceAdapter(
            FeedReactionJpaRepository repository, FeedReactionPersistenceMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    @Override
    public FeedReaction save(FeedReaction reaction) {
        return mapper.toDomain(repository.save(mapper.toEntity(reaction)));
    }

    @Override
    public boolean exists(UUID feedItemId, UUID userId, ReactionType type) {
        return repository.existsByFeedItemIdAndUserIdAndType(feedItemId, userId, type);
    }

    @Override
    public void delete(UUID feedItemId, UUID userId, ReactionType type) {
        repository.deleteByFeedItemIdAndUserIdAndType(feedItemId, userId, type);
    }

    @Override
    public List<FeedReaction> findByItemIds(Collection<UUID> feedItemIds) {
        if (feedItemIds.isEmpty()) {
            return List.of();
        }
        return repository.findByFeedItemIdIn(feedItemIds).stream().map(mapper::toDomain).toList();
    }
}
