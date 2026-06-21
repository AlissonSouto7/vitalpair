package com.aps.vitapair.feed.application.service;

import com.aps.vitapair.feed.domain.model.FeedItem;
import com.aps.vitapair.feed.domain.port.in.GetFeedUseCase;
import com.aps.vitapair.feed.domain.port.out.FeedItemRepositoryPort;
import com.aps.vitapair.shared.exception.ResourceNotFoundException;
import com.aps.vitapair.shared.web.PageResponse;
import com.aps.vitapair.user.domain.model.User;
import com.aps.vitapair.user.domain.port.out.UserRepositoryPort;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FeedService implements GetFeedUseCase {

    private final FeedItemRepositoryPort feedItemRepository;
    private final UserRepositoryPort userRepository;

    public FeedService(FeedItemRepositoryPort feedItemRepository, UserRepositoryPort userRepository) {
        this.feedItemRepository = feedItemRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<FeedItem> getFeed(UUID userId, int page, int size) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ResourceNotFoundException.of("Usuário", userId));
        return feedItemRepository.findByTenant(user.getTenantId(), page, size);
    }
}
