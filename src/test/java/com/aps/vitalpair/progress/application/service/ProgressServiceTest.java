package com.aps.vitalpair.progress.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import com.aps.vitalpair.progress.domain.model.CalorieDay;
import com.aps.vitalpair.progress.domain.model.DailyNutritionTotals;
import com.aps.vitalpair.progress.domain.model.MacroAverage;
import com.aps.vitalpair.progress.domain.model.ProgressView;
import com.aps.vitalpair.progress.domain.model.ProgressWindow;
import com.aps.vitalpair.progress.domain.model.WeightPoint;
import com.aps.vitalpair.progress.domain.port.out.NutritionMetricsPort;
import com.aps.vitalpair.progress.domain.port.out.WeightLogRepositoryPort;
import com.aps.vitalpair.shared.event.WeightLoggedEvent;
import com.aps.vitalpair.shared.exception.ResourceNotFoundException;
import com.aps.vitalpair.user.domain.model.User;
import com.aps.vitalpair.user.domain.port.out.UserRepositoryPort;

/**
 * The Progress screen's arithmetic and its day boundary.
 *
 * The averages are the part worth pinning: they divide by the window rather than by the days
 * that have records, so three logged days out of seven read as a third of the real intake.
 * That is deliberate (a week with four blank days is not a week on target) and is exactly the
 * kind of rule a later refactor "corrects" into something else.
 */
@ExtendWith(MockitoExtension.class)
class ProgressServiceTest {

    private static final UUID USER = UUID.randomUUID();
    private static final ZoneId SAO_PAULO = ZoneId.of("America/Sao_Paulo");

    @Mock
    private WeightLogRepositoryPort weightLogRepository;

    @Mock
    private NutritionMetricsPort nutritionMetrics;

    @Mock
    private UserRepositoryPort userRepository;

    /**
     * Recording a weight publishes an event, which gamification consumes to award the weight
     * badges. Mocked here because this class is about the progress numbers; what the event
     * earns is proved in WeightBadgeIT, against the database.
     */
    @Mock
    private ApplicationEventPublisher eventPublisher;

    private ProgressService service;

    @BeforeEach
    void setUp() {
        service = new ProgressService(weightLogRepository, nutritionMetrics, userRepository, eventPublisher);
    }

    @Test
    void averagesDivideByTheWholeWindowNotByTheDaysWithRecords() {
        LocalDate today = LocalDate.now(SAO_PAULO);
        givenUser(user().dailyCalorieTarget(2000)
                .proteinTargetG(150)
                .carbTargetG(200)
                .fatTargetG(60)
                .build());
        noWeightLogs();
        // 140 + 70 over seven days is 30 a day, not the 105 the two logged days averaged.
        givenTotals(
                new DailyNutritionTotals(today, 1000, 140, 0, 0),
                new DailyNutritionTotals(today.minusDays(1), 1000, 70, 0, 0));

        ProgressView view = service.getProgress(USER, ProgressWindow.WEEK);

        MacroAverage protein = macro(view, "PROTEIN");
        assertThat(protein.avgG()).isEqualTo(30);
        assertThat(protein.targetG()).isEqualTo(150);
    }

    @Test
    void theCalorieChartCoversSevenDaysEndingToday() {
        LocalDate today = LocalDate.now(SAO_PAULO);
        givenUser(user().dailyCalorieTarget(2000).build());
        noWeightLogs();
        givenTotals();

        ProgressView view = service.getProgress(USER, ProgressWindow.WEEK);

        assertThat(view.calories()).hasSize(7);
        assertThat(view.calories().get(0).date()).isEqualTo(today.minusDays(6));
        assertThat(view.calories().get(6).date()).isEqualTo(today);
        // A day with nothing logged is a day at zero, not a gap in the chart.
        assertThat(view.calories()).allSatisfy(day -> assertThat(day.kcal()).isZero());
    }

    @Test
    void adayIsWithinTheGoalUpToAndIncludingTheTarget() {
        LocalDate today = LocalDate.now(SAO_PAULO);
        givenUser(user().dailyCalorieTarget(2000).build());
        noWeightLogs();
        givenTotals(
                new DailyNutritionTotals(today, 2000, 0, 0, 0),
                new DailyNutritionTotals(today.minusDays(1), 2001, 0, 0, 0));

        ProgressView view = service.getProgress(USER, ProgressWindow.WEEK);

        assertThat(dayOf(view, today).withinGoal()).isTrue();
        assertThat(dayOf(view, today.minusDays(1)).withinGoal()).isFalse();
    }

    @Test
    void withoutATargetEveryDayCountsAsWithinTheGoal() {
        LocalDate today = LocalDate.now(SAO_PAULO);
        givenUser(user().dailyCalorieTarget(null).build());
        noWeightLogs();
        givenTotals(new DailyNutritionTotals(today, 9000, 0, 0, 0));

        ProgressView view = service.getProgress(USER, ProgressWindow.WEEK);

        // Nothing to be over, so the chart does not paint a profile red for having no goal.
        assertThat(dayOf(view, today).withinGoal()).isTrue();
        assertThat(view.targetKcal()).isNull();
    }

    @Test
    void theProfileWeightStandsInUntilSomebodyWeighsIn() {
        LocalDate today = LocalDate.now(SAO_PAULO);
        givenUser(user().weightKg(new BigDecimal("81.5")).build());
        noWeightLogs();
        givenTotals();

        ProgressView view = service.getProgress(USER, ProgressWindow.WEEK);

        // One point rather than an empty chart: the screen has something to draw from day one.
        assertThat(view.weights()).containsExactly(new WeightPoint(today, new BigDecimal("81.5")));
    }

    @Test
    void recordedWeightsWinOverTheProfileWeight() {
        givenUser(user().weightKg(new BigDecimal("81.5")).build());
        WeightPoint logged = new WeightPoint(LocalDate.now(SAO_PAULO).minusDays(3), new BigDecimal("79.0"));
        when(weightLogRepository.findRecentByUser(eq(USER), any(Integer.class))).thenReturn(List.of(logged));
        givenTotals();

        ProgressView view = service.getProgress(USER, ProgressWindow.WEEK);

        assertThat(view.weights()).containsExactly(logged);
    }

    @Test
    void aWeighInIsFiledUnderTheDayWhereThePersonIs() {
        when(userRepository.findById(USER)).thenReturn(Optional.of(user().build()));

        service.recordTodayWeight(USER, new BigDecimal("77.4"));

        ArgumentCaptor<LocalDate> date = ArgumentCaptor.forClass(LocalDate.class);
        verify(weightLogRepository).upsert(eq(USER), date.capture(), eq(new BigDecimal("77.4")));
        // The server's own date files a 21:30 weigh-in in Brazil under tomorrow, where it
        // then overwrites tomorrow's real entry when that arrives.
        assertThat(date.getValue()).isEqualTo(LocalDate.now(SAO_PAULO));
    }

    @Test
    void aWeighInStillLandsWhenTheProfileCannotBeRead() {
        when(userRepository.findById(USER)).thenReturn(Optional.empty());

        service.recordTodayWeight(USER, new BigDecimal("77.4"));

        // The caller is authenticated, so a miss means the account went away mid-request. The
        // write reports that more honestly than a 404 about the date would.
        verify(weightLogRepository).upsert(eq(USER), any(LocalDate.class), eq(new BigDecimal("77.4")));
    }

    @Test
    void aWeighInWithNoReadableProfilePublishesNothing() {
        // The write still happens, which the test above pins. What must not happen is an
        // event with a null tenant: gamification would try to award a badge against a goal
        // nobody could read, inside a listener that runs after the commit and whose failure
        // nothing surfaces.
        when(userRepository.findById(USER)).thenReturn(Optional.empty());

        service.recordTodayWeight(USER, new BigDecimal("77.4"));

        verify(weightLogRepository).upsert(eq(USER), any(LocalDate.class), eq(new BigDecimal("77.4")));
        verifyNoInteractions(eventPublisher);
    }

    @Test
    void aWeighInReadsTheStartingWeightBeforeOverwritingToday() {
        // Order matters and is the whole correctness of the weight badges: today's row is an
        // upsert, so on somebody's first weighing the record read afterwards would be the one
        // just written. The badge would then measure a change of zero, forever.
        when(userRepository.findById(USER)).thenReturn(Optional.of(user().build()));
        when(weightLogRepository.findStartWeight(USER)).thenReturn(Optional.of(new BigDecimal("80.0")));

        service.recordTodayWeight(USER, new BigDecimal("77.0"));

        InOrder order = inOrder(weightLogRepository);
        order.verify(weightLogRepository).findStartWeight(USER);
        order.verify(weightLogRepository).upsert(eq(USER), any(LocalDate.class), eq(new BigDecimal("77.0")));

        ArgumentCaptor<WeightLoggedEvent> event = ArgumentCaptor.forClass(WeightLoggedEvent.class);
        verify(eventPublisher).publishEvent(event.capture());
        assertThat(event.getValue().startWeightKg()).isEqualByComparingTo("80.0");
        assertThat(event.getValue().weightKg()).isEqualByComparingTo("77.0");
    }

    @Test
    void readingProgressForSomebodyWhoIsNotThereIsNotFound() {
        when(userRepository.findById(USER)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getProgress(USER, ProgressWindow.WEEK))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    private void givenUser(User user) {
        when(userRepository.findById(USER)).thenReturn(Optional.of(user));
    }

    private void noWeightLogs() {
        when(weightLogRepository.findRecentByUser(eq(USER), any(Integer.class))).thenReturn(List.of());
    }

    private void givenTotals(DailyNutritionTotals... totals) {
        when(nutritionMetrics.findDailyTotals(eq(USER), any(), any(), any())).thenReturn(List.of(totals));
    }

    private static User.UserBuilder user() {
        return User.builder().id(USER).tenantId(UUID.randomUUID()).timeZone(SAO_PAULO);
    }

    private static MacroAverage macro(ProgressView view, String key) {
        return view.macros().stream()
                .filter(m -> m.key().equals(key))
                .findFirst()
                .orElseThrow();
    }

    private static CalorieDay dayOf(ProgressView view, LocalDate date) {
        return view.calories().stream()
                .filter(d -> d.date().equals(date))
                .findFirst()
                .orElseThrow();
    }
}
