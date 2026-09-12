package com.aps.vitalpair.gamification.application.listener;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import com.aps.vitalpair.gamification.application.service.BadgeService;
import com.aps.vitalpair.gamification.application.service.CompetitionService;
import com.aps.vitalpair.gamification.application.service.StreakService;
import com.aps.vitalpair.gamification.domain.model.StreakType;
import com.aps.vitalpair.gamification.domain.model.UserStreak;
import com.aps.vitalpair.notification.domain.model.NotificationType;
import com.aps.vitalpair.notification.domain.port.in.CreateNotificationUseCase;
import com.aps.vitalpair.season.domain.model.PointSource;
import com.aps.vitalpair.season.domain.port.in.RecordPointUseCase;
import com.aps.vitalpair.shared.event.ActivityLoggedEvent;
import com.aps.vitalpair.shared.event.MealLoggedEvent;
import com.aps.vitalpair.shared.event.PairFormedEvent;
import com.aps.vitalpair.user.domain.model.User;
import com.aps.vitalpair.user.domain.port.out.UserRepositoryPort;

/**
 * The whole points economy in one class, and the feature's documentation called a test for it
 * the highest-value one left to write.
 *
 * <p>Three rules decide what somebody's score is: only the first record of a kind each day
 * scores, the scoreboard and the ledger always move together, and a streak milestone pays a
 * bonus. A change to any of them silently rewrites every score in the product.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class GamificationEventListenerTest {

    private static final UUID TENANT = UUID.randomUUID();
    private static final UUID YOU = UUID.randomUUID();
    private static final UUID PARTNER = UUID.randomUUID();
    private static final LocalDate TODAY = LocalDate.of(2026, 5, 20);

    @Mock
    private StreakService streakService;

    @Mock
    private CompetitionService competitionService;

    @Mock
    private BadgeService badgeService;

    @Mock
    private RecordPointUseCase pointLedger;

    @Mock
    private CreateNotificationUseCase notifications;

    @Mock
    private UserRepositoryPort userRepository;

    @InjectMocks
    private GamificationEventListener listener;

    @Test
    void amealScoresTenPointsOnBothTheScoreboardAndTheLedger() {
        givenStreakOf(1, StreakType.NUTRITION_LOG);

        listener.onMealLogged(meal());

        // The two have to move together, or the season view and the scoreboard disagree
        // about the same person on the same day.
        verify(competitionService).addPoints(TENANT, YOU, 10, TODAY);
        verify(pointLedger).record(TENANT, YOU, PointSource.MEAL, 10, TODAY);
    }

    @Test
    void anactivityScoresFifteen() {
        givenStreakOf(1, StreakType.ACTIVITY);

        listener.onActivityLogged(activity());

        verify(competitionService).addPoints(TENANT, YOU, 15, TODAY);
        verify(pointLedger).record(TENANT, YOU, PointSource.ACTIVITY, 15, TODAY);
    }

    @Test
    void thesecondMealOfTheDayScoresNothing() {
        // An empty streak result is how the streak service says "already counted today".
        when(streakService.registerActivity(any(), any(), any(), any())).thenReturn(Optional.empty());

        listener.onMealLogged(meal());

        // Otherwise logging breakfast five times would be a way to farm points.
        verify(competitionService, never()).addPoints(any(), any(), anyInt(), any());
        verify(pointLedger, never()).record(any(), any(), any(), anyInt(), any());
    }

    @Test
    void asevenDayStreakPaysAbonusOnTopOfTheMeal() {
        givenStreakOf(7, StreakType.NUTRITION_LOG);

        listener.onMealLogged(meal());

        verify(competitionService).addPoints(TENANT, YOU, 10, TODAY);
        verify(competitionService).addPoints(TENANT, YOU, 50, TODAY);
        verify(pointLedger).record(TENANT, YOU, PointSource.STREAK, 50, TODAY);
        verify(badgeService).awardByCode(YOU, TENANT, "STREAK_7_NUTRITION");
    }

    @Test
    void thebonusRepeatsEverySevenDaysNotOnlyTheFirstTime() {
        givenStreakOf(14, StreakType.NUTRITION_LOG);

        listener.onMealLogged(meal());

        // Fourteen is a milestone too: the bonus is every seventh day, not a one-off.
        verify(competitionService).addPoints(TENANT, YOU, 50, TODAY);
    }

    @Test
    void adayThatIsNotAmilestonePaysNoBonus() {
        givenStreakOf(6, StreakType.NUTRITION_LOG);

        listener.onMealLogged(meal());

        verify(competitionService).addPoints(TENANT, YOU, 10, TODAY);
        verify(competitionService, never()).addPoints(TENANT, YOU, 50, TODAY);
        verify(pointLedger, never()).record(any(), any(), eq(PointSource.STREAK), anyInt(), any());
    }

    @Test
    void overtakingTheRivalTellsTheRival() {
        givenStreakOf(1, StreakType.NUTRITION_LOG);
        givenPartner();
        // Behind before, ahead after: the transition the notification exists for.
        when(competitionService.currentScoreOf(TENANT, YOU, TODAY)).thenReturn(90, 100);
        when(competitionService.currentScoreOf(TENANT, PARTNER, TODAY)).thenReturn(95);
        when(userRepository.findById(YOU))
                .thenReturn(Optional.of(User.builder()
                        .id(YOU)
                        .tenantId(TENANT)
                        .name("Alisson Pinheiro Souto")
                        .build()));

        listener.onMealLogged(meal());

        // The one overtaken is told, and told a first name rather than a full one.
        verify(notifications)
                .create(eq(TENANT), eq(PARTNER), eq(NotificationType.RIVAL_OVERTOOK), eq("Alisson"), any(), any());
    }

    @Test
    void stayingAheadDoesNotTellTheRivalAgain() {
        givenStreakOf(1, StreakType.NUTRITION_LOG);
        givenPartner();
        // Already ahead before scoring: nothing changed hands.
        when(competitionService.currentScoreOf(TENANT, YOU, TODAY)).thenReturn(200, 210);
        when(competitionService.currentScoreOf(TENANT, PARTNER, TODAY)).thenReturn(95);

        listener.onMealLogged(meal());

        // Otherwise every meal would notify the partner for the rest of the season.
        verify(notifications, never()).create(any(), any(), any(), any(), any(), any());
    }

    @Test
    void scoringAloneNotifiesNobody() {
        givenStreakOf(1, StreakType.NUTRITION_LOG);
        when(competitionService.partnerOf(TENANT, YOU)).thenReturn(null);

        listener.onMealLogged(meal());

        verify(competitionService).addPoints(TENANT, YOU, 10, TODAY);
        verify(notifications, never()).create(any(), any(), any(), any(), any(), any());
    }

    @Test
    void thefirstOfEachKindEarnsItsOwnBadgeEvenBeforeTheStreakCounts() {
        when(streakService.registerActivity(any(), any(), any(), any())).thenReturn(Optional.empty());

        listener.onMealLogged(meal());
        listener.onActivityLogged(activity());

        // The badge is awarded outside the streak block on purpose: the second meal of the
        // day scores nothing but must not un-earn the badge.
        verify(badgeService).awardByCode(YOU, TENANT, "FIRST_MEAL");
        verify(badgeService).awardByCode(YOU, TENANT, "FIRST_ACTIVITY");
    }

    @Test
    void formingApairBadgesBothPeople() {
        listener.onPairFormed(new PairFormedEvent(TENANT, YOU, PARTNER));

        verify(badgeService).awardByCode(YOU, TENANT, "PAIR_FORMED");
        verify(badgeService).awardByCode(PARTNER, TENANT, "PAIR_FORMED");
    }

    @Test
    void ahalfFormedPairBadgesOnlyTheMemberThatExists() {
        listener.onPairFormed(new PairFormedEvent(TENANT, YOU, null));

        verify(badgeService, times(1)).awardByCode(any(), any(), eq("PAIR_FORMED"));
    }

    private void givenStreakOf(int count, StreakType type) {
        when(streakService.registerActivity(eq(YOU), eq(TENANT), eq(type), eq(TODAY)))
                .thenReturn(Optional.of(UserStreak.builder()
                        .userId(YOU)
                        .tenantId(TENANT)
                        .type(type)
                        .currentCount(count)
                        .build()));
    }

    private void givenPartner() {
        when(competitionService.partnerOf(TENANT, YOU)).thenReturn(PARTNER);
    }

    private static MealLoggedEvent meal() {
        return new MealLoggedEvent(YOU, TENANT, TODAY, "Salada", "LUNCH", false, 400, 20, 40, 12);
    }

    private static ActivityLoggedEvent activity() {
        return new ActivityLoggedEvent(YOU, TENANT, TODAY, "RUNNING", 300, 40);
    }
}
