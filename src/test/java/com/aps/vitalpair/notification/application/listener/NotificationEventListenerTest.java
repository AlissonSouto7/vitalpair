package com.aps.vitalpair.notification.application.listener;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
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
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import com.aps.vitalpair.notification.domain.model.NotificationType;
import com.aps.vitalpair.notification.domain.port.in.CreateNotificationUseCase;
import com.aps.vitalpair.pair.domain.model.Pair;
import com.aps.vitalpair.pair.domain.model.PairStatus;
import com.aps.vitalpair.pair.domain.port.out.PairRepositoryPort;
import com.aps.vitalpair.shared.event.ActivityLoggedEvent;
import com.aps.vitalpair.shared.event.MealLoggedEvent;
import com.aps.vitalpair.shared.event.PairFormedEvent;
import com.aps.vitalpair.user.domain.model.User;
import com.aps.vitalpair.user.domain.port.out.UserRepositoryPort;

/**
 * What the partner is told when somebody logs something.
 *
 * <p>The private meal is the rule that matters most here: marking a meal private is a promise
 * that the other person will not see it, and a notification is exactly how they would. It had
 * nothing asserting it.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class NotificationEventListenerTest {

    private static final UUID TENANT = UUID.randomUUID();
    private static final UUID YOU = UUID.randomUUID();
    private static final UUID PARTNER = UUID.randomUUID();

    @Mock
    private CreateNotificationUseCase notifications;

    @Mock
    private PairRepositoryPort pairRepository;

    @Mock
    private UserRepositoryPort userRepository;

    @InjectMocks
    private NotificationEventListener listener;

    @Test
    void aprivateMealTellsNobody() {
        givenPair();

        listener.onMealLogged(meal(YOU, "Pizza inteira", true));

        // Private means private. The partner is not told, not even vaguely.
        verify(notifications, never()).create(any(), any(), any(), any(), any(), any());
    }

    @Test
    void apublicMealTellsThePartnerWhatItWas() {
        givenPair();

        listener.onMealLogged(meal(YOU, "Salada de grão-de-bico", false));

        ArgumentCaptor<UUID> recipient = ArgumentCaptor.forClass(UUID.class);
        verify(notifications)
                .create(
                        eq(TENANT),
                        recipient.capture(),
                        eq(NotificationType.PARTNER_MEAL),
                        eq("Alisson"),
                        eq("Salada de grão-de-bico"),
                        eq(null));
        // The recipient is the other person, never the one who logged it.
        assertThat(recipient.getValue()).isEqualTo(PARTNER);
    }

    @Test
    void thepartnerIsWhicheverHalfOfThePairDidNotAct() {
        givenPair();

        // Same pair, other direction: user2 logging notifies user1.
        listener.onMealLogged(meal(PARTNER, "Tapioca", false));

        verify(notifications).create(eq(TENANT), eq(YOU), eq(NotificationType.PARTNER_MEAL), any(), any(), any());
    }

    @Test
    void nobodyIsNotifiedWhileThereIsNoPartner() {
        when(pairRepository.findById(TENANT))
                .thenReturn(Optional.of(Pair.builder()
                        .id(TENANT)
                        .user1Id(YOU)
                        .user2Id(null)
                        .status(PairStatus.PENDING)
                        .build()));

        listener.onMealLogged(meal(YOU, "Café", false));
        listener.onActivityLogged(activity(YOU, 300));

        // A pending pair has one member, and a notification to null would be a row nobody
        // can read plus a constraint violation.
        verify(notifications, never()).create(any(), any(), any(), any(), any(), any());
    }

    @Test
    void anactivityTellsThePartnerHowMuchWasBurned() {
        givenPair();

        listener.onActivityLogged(activity(YOU, 420));

        verify(notifications)
                .create(
                        eq(TENANT),
                        eq(PARTNER),
                        eq(NotificationType.PARTNER_ACTIVITY),
                        eq("Alisson"),
                        eq(null),
                        eq(420));
    }

    @Test
    void formingApairTellsBothPeople() {
        listener.onPairFormed(new PairFormedEvent(TENANT, YOU, PARTNER));

        verify(notifications).create(eq(TENANT), eq(YOU), eq(NotificationType.PAIR_FORMED), any(), any(), any());
        verify(notifications).create(eq(TENANT), eq(PARTNER), eq(NotificationType.PAIR_FORMED), any(), any(), any());
    }

    @Test
    void ahalfFormedPairTellsOnlyTheMemberThatExists() {
        listener.onPairFormed(new PairFormedEvent(TENANT, YOU, null));

        verify(notifications).create(eq(TENANT), eq(YOU), eq(NotificationType.PAIR_FORMED), any(), any(), any());
        verify(notifications, org.mockito.Mockito.times(1))
                .create(any(), any(), eq(NotificationType.PAIR_FORMED), any(), any(), any());
    }

    @Test
    void anunreadableNameStillProducesAnotification() {
        when(pairRepository.findById(TENANT))
                .thenReturn(Optional.of(Pair.builder()
                        .id(TENANT)
                        .user1Id(YOU)
                        .user2Id(PARTNER)
                        .status(PairStatus.ACTIVE)
                        .build()));
        when(userRepository.findById(YOU)).thenReturn(Optional.empty());

        listener.onMealLogged(meal(YOU, "Arroz", false));

        // A missing profile is not a reason to drop the notification: it gets a generic name.
        verify(notifications)
                .create(eq(TENANT), eq(PARTNER), eq(NotificationType.PARTNER_MEAL), eq("Seu parceiro"), any(), any());
    }

    /** A meal event as the nutrition feature publishes it: the actor first, then the tenant. */
    private static MealLoggedEvent meal(UUID actor, String foodName, boolean isPrivate) {
        return new MealLoggedEvent(
                actor, TENANT, LocalDate.of(2026, 5, 20), foodName, "LUNCH", isPrivate, 500, 30, 50, 15);
    }

    private static ActivityLoggedEvent activity(UUID actor, int caloriesBurned) {
        return new ActivityLoggedEvent(actor, TENANT, LocalDate.of(2026, 5, 20), "RUNNING", caloriesBurned, 45);
    }

    private void givenPair() {
        when(pairRepository.findById(TENANT))
                .thenReturn(Optional.of(Pair.builder()
                        .id(TENANT)
                        .user1Id(YOU)
                        .user2Id(PARTNER)
                        .status(PairStatus.ACTIVE)
                        .build()));
        when(userRepository.findById(YOU))
                .thenReturn(Optional.of(
                        User.builder().id(YOU).tenantId(TENANT).name("Alisson").build()));
        when(userRepository.findById(PARTNER))
                .thenReturn(Optional.of(User.builder()
                        .id(PARTNER)
                        .tenantId(TENANT)
                        .name("Célia")
                        .build()));
    }
}
