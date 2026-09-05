package com.aps.vitalpair.feed.application.service;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.aps.vitalpair.feed.domain.model.FeedItem;
import com.aps.vitalpair.feed.domain.model.ReactionType;
import com.aps.vitalpair.feed.domain.port.out.FeedItemRepositoryPort;
import com.aps.vitalpair.feed.domain.port.out.FeedReactionRepositoryPort;
import com.aps.vitalpair.shared.exception.ResourceNotFoundException;
import com.aps.vitalpair.user.domain.model.User;
import com.aps.vitalpair.user.domain.port.out.UserRepositoryPort;

@ExtendWith(MockitoExtension.class)
class ReactionServiceTest {

    private static final UUID USER = UUID.randomUUID();
    private static final UUID TENANT = UUID.randomUUID();
    private static final UUID ITEM = UUID.randomUUID();

    @Mock
    private FeedReactionRepositoryPort reactionRepository;

    @Mock
    private FeedItemRepositoryPort feedItemRepository;

    @Mock
    private UserRepositoryPort userRepository;

    @InjectMocks
    private ReactionService service;

    @Test
    void reageQuandoItemEstaNoTenantDoUsuario() {
        when(userRepository.findById(USER)).thenReturn(Optional.of(user(TENANT)));
        when(feedItemRepository.findById(ITEM)).thenReturn(Optional.of(item(TENANT)));
        when(reactionRepository.exists(ITEM, USER, ReactionType.FIRE)).thenReturn(false);

        service.react(USER, ITEM, ReactionType.FIRE);

        verify(reactionRepository).save(any());
    }

    @Test
    void naoReageEmItemDeOutroTenant() {
        when(userRepository.findById(USER)).thenReturn(Optional.of(user(TENANT)));
        when(feedItemRepository.findById(ITEM)).thenReturn(Optional.of(item(UUID.randomUUID())));

        assertThatThrownBy(() -> service.react(USER, ITEM, ReactionType.FIRE))
                .isInstanceOf(ResourceNotFoundException.class);
        verify(reactionRepository, never()).save(any());
    }

    private User user(UUID tenantId) {
        return User.builder()
                .id(USER)
                .tenantId(tenantId)
                .email("a@a.com")
                .name("Ana")
                .build();
    }

    private FeedItem item(UUID tenantId) {
        return FeedItem.builder()
                .id(ITEM)
                .tenantId(tenantId)
                .userId(USER)
                .actorName("Ana")
                .build();
    }
}
