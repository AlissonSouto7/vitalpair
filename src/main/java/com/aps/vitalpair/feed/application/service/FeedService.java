package com.aps.vitalpair.feed.application.service;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.aps.vitalpair.feed.application.dto.FeedItemView;
import com.aps.vitalpair.feed.domain.model.FeedItem;
import com.aps.vitalpair.feed.domain.model.FeedReaction;
import com.aps.vitalpair.feed.domain.model.ReactionType;
import com.aps.vitalpair.feed.domain.port.in.GetFeedUseCase;
import com.aps.vitalpair.feed.domain.port.out.FeedItemRepositoryPort;
import com.aps.vitalpair.feed.domain.port.out.FeedReactionRepositoryPort;
import com.aps.vitalpair.shared.exception.ResourceNotFoundException;
import com.aps.vitalpair.shared.web.PageResponse;
import com.aps.vitalpair.user.domain.model.User;
import com.aps.vitalpair.user.domain.port.out.UserRepositoryPort;

@Service
public class FeedService implements GetFeedUseCase {

    private final FeedItemRepositoryPort feedItemRepository;
    private final FeedReactionRepositoryPort reactionRepository;
    private final UserRepositoryPort userRepository;

    public FeedService(
            FeedItemRepositoryPort feedItemRepository,
            FeedReactionRepositoryPort reactionRepository,
            UserRepositoryPort userRepository) {
        this.feedItemRepository = feedItemRepository;
        this.reactionRepository = reactionRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<FeedItemView> getFeed(UUID userId, int page, int size) {
        User user = userRepository.findById(userId).orElseThrow(() -> ResourceNotFoundException.of("Usuário", userId));

        PageResponse<FeedItem> items = feedItemRepository.findVisibleByTenant(user.getTenantId(), userId, page, size);
        List<UUID> itemIds = items.content().stream().map(FeedItem::getId).toList();
        List<FeedReaction> reactions = reactionRepository.findByItemIds(itemIds);

        Map<UUID, Map<ReactionType, Long>> countsByItem = reactions.stream()
                .collect(Collectors.groupingBy(
                        FeedReaction::getFeedItemId,
                        Collectors.groupingBy(FeedReaction::getType, Collectors.counting())));
        Map<UUID, Set<ReactionType>> mineByItem = reactions.stream()
                .filter(r -> r.getUserId().equals(userId))
                .collect(Collectors.groupingBy(
                        FeedReaction::getFeedItemId, Collectors.mapping(FeedReaction::getType, Collectors.toSet())));

        List<FeedItemView> views = items.content().stream()
                .map(item -> new FeedItemView(
                        item,
                        countsByItem.getOrDefault(item.getId(), Map.of()),
                        mineByItem.getOrDefault(item.getId(), Set.of())))
                .toList();

        return new PageResponse<>(
                views, items.page(), items.size(), items.totalElements(), items.totalPages(), items.last());
    }
}
