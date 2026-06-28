package com.aps.vitalpair.feed.application.service;

import com.aps.vitalpair.feed.domain.model.FeedItem;
import com.aps.vitalpair.feed.domain.model.FeedReaction;
import com.aps.vitalpair.feed.domain.model.ReactionType;
import com.aps.vitalpair.feed.domain.port.in.ReactToFeedItemUseCase;
import com.aps.vitalpair.feed.domain.port.out.FeedItemRepositoryPort;
import com.aps.vitalpair.feed.domain.port.out.FeedReactionRepositoryPort;
import com.aps.vitalpair.shared.exception.ResourceNotFoundException;
import com.aps.vitalpair.user.domain.model.User;
import com.aps.vitalpair.user.domain.port.out.UserRepositoryPort;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReactionService implements ReactToFeedItemUseCase {

    private final FeedReactionRepositoryPort reactionRepository;
    private final FeedItemRepositoryPort feedItemRepository;
    private final UserRepositoryPort userRepository;

    public ReactionService(
            FeedReactionRepositoryPort reactionRepository,
            FeedItemRepositoryPort feedItemRepository,
            UserRepositoryPort userRepository) {
        this.reactionRepository = reactionRepository;
        this.feedItemRepository = feedItemRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public void react(UUID userId, UUID feedItemId, ReactionType type) {
        requireItemInUserTenant(userId, feedItemId);
        if (!reactionRepository.exists(feedItemId, userId, type)) {
            reactionRepository.save(FeedReaction.builder()
                    .feedItemId(feedItemId).userId(userId).type(type)
                    .build());
        }
    }

    @Override
    @Transactional
    public void removeReaction(UUID userId, UUID feedItemId, ReactionType type) {
        requireItemInUserTenant(userId, feedItemId);
        reactionRepository.delete(feedItemId, userId, type);
    }

    private void requireItemInUserTenant(UUID userId, UUID feedItemId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ResourceNotFoundException.of("Usuário", userId));
        FeedItem item = feedItemRepository.findById(feedItemId)
                .orElseThrow(() -> ResourceNotFoundException.of("Item do feed", feedItemId));
        if (!item.getTenantId().equals(user.getTenantId())) {
            throw ResourceNotFoundException.of("Item do feed", feedItemId);
        }
    }
}
