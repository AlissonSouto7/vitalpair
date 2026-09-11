package com.aps.vitalpair.feed.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import com.aps.vitalpair.feed.application.dto.FeedItemView;
import com.aps.vitalpair.feed.domain.model.FeedItem;
import com.aps.vitalpair.feed.domain.model.FeedItemType;
import com.aps.vitalpair.feed.domain.model.FeedReaction;
import com.aps.vitalpair.feed.domain.model.ReactionType;
import com.aps.vitalpair.feed.domain.port.out.FeedItemRepositoryPort;
import com.aps.vitalpair.feed.domain.port.out.FeedReactionRepositoryPort;
import com.aps.vitalpair.shared.exception.ResourceNotFoundException;
import com.aps.vitalpair.shared.web.PageResponse;
import com.aps.vitalpair.user.domain.model.User;
import com.aps.vitalpair.user.domain.port.out.UserRepositoryPort;

/**
 * Assembling the feed page: the items, how many reactions each one has, and which of them
 * are the caller's own.
 *
 * <p>Both maps are built from a single reaction query for the whole page. That is what keeps
 * the feed from issuing one query per item, and it is the kind of thing a later change
 * quietly undoes, so the test asserts the query is asked once with every id.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class FeedServiceTest {

    private static final UUID TENANT = UUID.randomUUID();
    private static final UUID YOU = UUID.randomUUID();
    private static final UUID PARTNER = UUID.randomUUID();
    private static final UUID ITEM_A = UUID.randomUUID();
    private static final UUID ITEM_B = UUID.randomUUID();

    @Mock
    private FeedItemRepositoryPort feedItemRepository;

    @Mock
    private FeedReactionRepositoryPort reactionRepository;

    @Mock
    private UserRepositoryPort userRepository;

    @InjectMocks
    private FeedService service;

    @Test
    void reactionsAreCountedPerItemAndPerType() {
        givenUser();
        givenItems(item(ITEM_A), item(ITEM_B));
        when(reactionRepository.findByItemIds(any()))
                .thenReturn(List.of(
                        reaction(ITEM_A, PARTNER, ReactionType.FIRE),
                        reaction(ITEM_A, YOU, ReactionType.FIRE),
                        reaction(ITEM_A, YOU, ReactionType.STRENGTH),
                        reaction(ITEM_B, PARTNER, ReactionType.STRENGTH)));

        List<FeedItemView> views = service.getFeed(YOU, 0, 20).content();

        assertThat(views.get(0).reactionCounts())
                .containsExactlyInAnyOrderEntriesOf(Map.of(
                        ReactionType.FIRE, 2L,
                        ReactionType.STRENGTH, 1L));
        assertThat(views.get(1).reactionCounts()).isEqualTo(Map.of(ReactionType.STRENGTH, 1L));
    }

    @Test
    void mineIsOnlyWhatIreactedWith() {
        givenUser();
        givenItems(item(ITEM_A));
        when(reactionRepository.findByItemIds(any()))
                .thenReturn(List.of(
                        reaction(ITEM_A, YOU, ReactionType.FIRE), reaction(ITEM_A, PARTNER, ReactionType.STRENGTH)));

        FeedItemView view = service.getFeed(YOU, 0, 20).content().get(0);

        // Both reactions count towards the totals; only one lights up as mine.
        assertThat(view.reactionCounts()).isEqualTo(Map.of(ReactionType.FIRE, 1L, ReactionType.STRENGTH, 1L));
        assertThat(view.myReactions()).containsExactly(ReactionType.FIRE);
    }

    @Test
    void anitemNobodyReactedToCarriesEmptyMapsRatherThanNulls() {
        givenUser();
        givenItems(item(ITEM_A));
        when(reactionRepository.findByItemIds(any())).thenReturn(List.of());

        FeedItemView view = service.getFeed(YOU, 0, 20).content().get(0);

        // The screen iterates these without checking for null.
        assertThat(view.reactionCounts()).isEmpty();
        assertThat(view.myReactions()).isEmpty();
    }

    @Test
    void thewholePageCostsOneReactionQuery() {
        givenUser();
        givenItems(item(ITEM_A), item(ITEM_B));
        when(reactionRepository.findByItemIds(any())).thenReturn(List.of());

        service.getFeed(YOU, 0, 20);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<UUID>> ids = ArgumentCaptor.forClass(List.class);
        verify(reactionRepository, org.mockito.Mockito.times(1)).findByItemIds(ids.capture());
        // One call carrying every id on the page, not one call per item.
        assertThat(ids.getValue()).containsExactly(ITEM_A, ITEM_B);
    }

    @Test
    void thefeedIsAskedForTheCallersOwnTenant() {
        givenUser();
        givenItems(item(ITEM_A));
        when(reactionRepository.findByItemIds(any())).thenReturn(List.of());

        service.getFeed(YOU, 2, 15);

        // The tenant comes from the stored profile, never from the request: this is the
        // boundary that keeps one pair's feed out of another's.
        verify(feedItemRepository).findVisibleByTenant(eq(TENANT), eq(YOU), eq(2), eq(15));
    }

    @Test
    void thepagingNumbersSurviveTheMappingIntact() {
        givenUser();
        when(feedItemRepository.findVisibleByTenant(any(), any(), anyInt(), anyInt()))
                .thenReturn(new PageResponse<>(List.of(item(ITEM_A)), 3, 15, 47L, 4, false));
        when(reactionRepository.findByItemIds(any())).thenReturn(List.of());

        PageResponse<FeedItemView> page = service.getFeed(YOU, 3, 15);

        // Rebuilding the envelope around mapped content is where a page number gets lost.
        assertThat(page.page()).isEqualTo(3);
        assertThat(page.size()).isEqualTo(15);
        assertThat(page.totalElements()).isEqualTo(47L);
        assertThat(page.totalPages()).isEqualTo(4);
        assertThat(page.last()).isFalse();
    }

    @Test
    void afeedForSomebodyWhoIsNotThereIsNotFound() {
        when(userRepository.findById(YOU)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getFeed(YOU, 0, 20)).isInstanceOf(ResourceNotFoundException.class);
    }

    private void givenUser() {
        when(userRepository.findById(YOU))
                .thenReturn(Optional.of(
                        User.builder().id(YOU).tenantId(TENANT).name("Alisson").build()));
    }

    private void givenItems(FeedItem... items) {
        when(feedItemRepository.findVisibleByTenant(any(), any(), anyInt(), anyInt()))
                .thenReturn(new PageResponse<>(List.of(items), 0, 20, items.length, 1, true));
    }

    private static FeedItem item(UUID id) {
        return FeedItem.builder()
                .id(id)
                .tenantId(TENANT)
                .userId(PARTNER)
                .actorName("Célia")
                .type(FeedItemType.MEAL_LOGGED)
                .title("Almoço")
                .points(10)
                .isPrivate(false)
                .build();
    }

    private static FeedReaction reaction(UUID itemId, UUID userId, ReactionType type) {
        return FeedReaction.builder()
                .id(UUID.randomUUID())
                .feedItemId(itemId)
                .userId(userId)
                .type(type)
                .build();
    }
}
