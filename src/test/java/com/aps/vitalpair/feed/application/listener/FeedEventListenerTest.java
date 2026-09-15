package com.aps.vitalpair.feed.application.listener;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.aps.vitalpair.feed.domain.model.FeedItem;
import com.aps.vitalpair.feed.domain.model.FeedItemType;
import com.aps.vitalpair.feed.domain.port.out.FeedItemRepositoryPort;
import com.aps.vitalpair.shared.event.ActivityDeletedEvent;
import com.aps.vitalpair.shared.event.ActivityLoggedEvent;
import com.aps.vitalpair.shared.event.MealDeletedEvent;
import com.aps.vitalpair.shared.event.MealLoggedEvent;
import com.aps.vitalpair.user.domain.model.User;
import com.aps.vitalpair.user.domain.port.out.UserRepositoryPort;

/**
 * What the timeline stores, and what it deliberately does not.
 *
 * <p>These used to assert the opposite of what they assert now: that the listener built a
 * Portuguese sentence and stamped 10 or 15 points on the item. Both were defects. The sentence
 * left the feed in Portuguese with the interface in English, and the points were a constant the
 * feed had no way to verify, so the badge claimed awards that were never granted.
 */
@ExtendWith(MockitoExtension.class)
class FeedEventListenerTest {

    private static final UUID USER = UUID.randomUUID();
    private static final UUID TENANT = UUID.randomUUID();
    private static final UUID SOURCE = UUID.randomUUID();
    private static final LocalDate TODAY = LocalDate.of(2026, 6, 21);

    @Mock
    private FeedItemRepositoryPort feedItemRepository;

    @Mock
    private UserRepositoryPort userRepository;

    @InjectMocks
    private FeedEventListener listener;

    @Test
    void amealItemStoresTheFactsAndNoSentence() {
        givenUserNamed("Ana");

        listener.onMealLogged(
                new MealLoggedEvent(USER, TENANT, SOURCE, TODAY, "Arroz", "LUNCH", false, 585, 48, 62, 14));

        FeedItem saved = capture();
        assertThat(saved.getType()).isEqualTo(FeedItemType.MEAL_LOGGED);
        assertThat(saved.getActorName()).isEqualTo("Ana");
        assertThat(saved.getFoodName()).isEqualTo("Arroz");
        assertThat(saved.getMealType()).isEqualTo("LUNCH");
        assertThat(saved.getCalories()).isEqualTo(585);
        assertThat(saved.getProteinG()).isEqualTo(48);
        assertThat(saved.getCarbG()).isEqualTo(62);
        assertThat(saved.getFatG()).isEqualTo(14);
        // No pre-rendered text: the screen writes it, in the reader's language.
        assertThat(saved.getTitle()).isNull();
        assertThat(saved.getSubtitle()).isNull();
    }

    @Test
    void anactivityItemStoresTheFactsAndNoSentence() {
        givenUserNamed("Ana");

        listener.onActivityLogged(new ActivityLoggedEvent(USER, TENANT, SOURCE, TODAY, "RUN", 320, 35));

        FeedItem saved = capture();
        assertThat(saved.getType()).isEqualTo(FeedItemType.ACTIVITY_LOGGED);
        assertThat(saved.getActivityType()).isEqualTo("RUN");
        assertThat(saved.getCalories()).isEqualTo(320);
        assertThat(saved.getDurationMinutes()).isEqualTo(35);
        assertThat(saved.getTitle()).isNull();
    }

    @Test
    void anitemClaimsNoPointsBecauseTheFeedCannotKnowThem() {
        givenUserNamed("Ana");

        listener.onMealLogged(
                new MealLoggedEvent(USER, TENANT, SOURCE, TODAY, "Arroz", "LUNCH", false, 585, 48, 62, 14));
        listener.onActivityLogged(new ActivityLoggedEvent(USER, TENANT, SOURCE, TODAY, "RUN", 320, 35));

        // Points go to the first record of the day only, and that decision is gamification's,
        // taken on the same event in no defined order. Stamping a constant here is what made the
        // timeline advertise 625 points against 305 actually in the ledger.
        ArgumentCaptor<FeedItem> captor = ArgumentCaptor.forClass(FeedItem.class);
        verify(feedItemRepository, org.mockito.Mockito.times(2)).save(captor.capture());
        assertThat(captor.getAllValues())
                .allSatisfy(item -> assertThat(item.getPoints()).isZero());
    }

    @Test
    void theitemRemembersWhichRecordItCameFrom() {
        givenUserNamed("Ana");

        listener.onMealLogged(
                new MealLoggedEvent(USER, TENANT, SOURCE, TODAY, "Arroz", "LUNCH", false, 585, 48, 62, 14));

        // Without this there is no way to find the item when the meal is deleted, which is why
        // a deleted meal used to stay in the partner's timeline.
        assertThat(capture().getSourceId()).isEqualTo(SOURCE);
    }

    @Test
    void deletingAmealRemovesItsItem() {
        listener.onMealDeleted(new MealDeletedEvent(USER, TENANT, SOURCE));

        verify(feedItemRepository).deleteBySource(TENANT, SOURCE);
    }

    @Test
    void deletingAnactivityRemovesItsItem() {
        listener.onActivityDeleted(new ActivityDeletedEvent(USER, TENANT, SOURCE));

        verify(feedItemRepository).deleteBySource(TENANT, SOURCE);
    }

    @Test
    void aprivateMealIsStoredPrivate() {
        givenUserNamed("Ana");

        listener.onMealLogged(
                new MealLoggedEvent(USER, TENANT, SOURCE, TODAY, "Pizza", "DINNER", true, 900, 30, 90, 40));

        assertThat(capture().isPrivate()).isTrue();
    }

    @Test
    void amissingProfileStillProducesAnitem() {
        when(userRepository.findById(USER)).thenReturn(Optional.empty());

        listener.onMealLogged(
                new MealLoggedEvent(USER, TENANT, SOURCE, TODAY, "Arroz", "LUNCH", false, 585, 48, 62, 14));

        // Losing the timeline entry would be a worse answer than a generic name.
        assertThat(capture().getActorName()).isEqualTo("Alguém");
    }

    private void givenUserNamed(String name) {
        when(userRepository.findById(USER))
                .thenReturn(Optional.of(User.builder()
                        .id(USER)
                        .tenantId(TENANT)
                        .email("ana@a.com")
                        .name(name)
                        .build()));
    }

    private FeedItem capture() {
        ArgumentCaptor<FeedItem> captor = ArgumentCaptor.forClass(FeedItem.class);
        verify(feedItemRepository).save(captor.capture());
        return captor.getValue();
    }
}
