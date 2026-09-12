package com.aps.vitalpair.mission.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import com.aps.vitalpair.mission.domain.model.WeeklyMission;
import com.aps.vitalpair.mission.domain.model.WeeklyMissionMetric;
import com.aps.vitalpair.mission.domain.model.WeeklyMissionProgress;
import com.aps.vitalpair.mission.domain.model.WeeklyMissionScope;
import com.aps.vitalpair.mission.domain.port.out.WeeklyMissionCatalogRepositoryPort;
import com.aps.vitalpair.mission.domain.port.out.WeeklyMissionMetricsRepositoryPort;
import com.aps.vitalpair.pair.domain.model.Pair;
import com.aps.vitalpair.pair.domain.model.PairStatus;
import com.aps.vitalpair.pair.domain.port.out.PairRepositoryPort;
import com.aps.vitalpair.user.domain.model.User;
import com.aps.vitalpair.user.domain.port.out.UserRepositoryPort;

/**
 * The weekly missions, whose whole point is that a PAIR mission takes two people.
 *
 * <p>That rule is the one worth pinning: "completed" for a pair mission means both halves
 * reached the target, so a version that only checks the caller would tell one person they
 * finished something the pair did not.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class WeeklyMissionServiceTest {

    private static final ZoneId SAO_PAULO = ZoneId.of("America/Sao_Paulo");
    private static final UUID TENANT = UUID.randomUUID();
    private static final UUID YOU = UUID.randomUUID();
    private static final UUID PARTNER = UUID.randomUUID();

    @Mock
    private WeeklyMissionCatalogRepositoryPort catalogRepository;

    @Mock
    private WeeklyMissionMetricsRepositoryPort metricsRepository;

    @Mock
    private PairRepositoryPort pairRepository;

    @Mock
    private UserRepositoryPort userRepository;

    private WeeklyMissionService serviceOn(LocalDate today) {
        Clock fixed = Clock.fixed(today.atTime(15, 0).atZone(SAO_PAULO).toInstant(), SAO_PAULO);
        return new WeeklyMissionService(
                catalogRepository, metricsRepository, pairRepository, userRepository, fixed, SAO_PAULO.getId());
    }

    @Test
    void theWeekIsCountedFromMondayToTheEndOfToday() {
        givenPair();
        givenCatalog(mission("M1", 5, WeeklyMissionScope.SELF));
        // A Wednesday: the window has to open on the Monday before it, not seven days back.
        LocalDate wednesday = LocalDate.of(2026, 5, 20);
        assertThat(wednesday.getDayOfWeek()).isEqualTo(DayOfWeek.WEDNESDAY);

        serviceOn(wednesday).getCurrentWeek(YOU);

        ArgumentCaptor<Instant> start = ArgumentCaptor.forClass(Instant.class);
        ArgumentCaptor<Instant> end = ArgumentCaptor.forClass(Instant.class);
        verify(metricsRepository).countMealDays(eq(YOU), start.capture(), end.capture());
        assertThat(start.getValue())
                .isEqualTo(LocalDate.of(2026, 5, 18).atStartOfDay(SAO_PAULO).toInstant());
        // Exclusive end at the start of tomorrow, so everything logged today counts.
        assertThat(end.getValue())
                .isEqualTo(wednesday.plusDays(1).atStartOfDay(SAO_PAULO).toInstant());
    }

    @Test
    void mondayItselfIsTheFirstDayOfItsOwnWeek() {
        givenPair();
        givenCatalog(mission("M1", 5, WeeklyMissionScope.SELF));
        LocalDate monday = LocalDate.of(2026, 5, 18);

        serviceOn(monday).getCurrentWeek(YOU);

        ArgumentCaptor<Instant> start = ArgumentCaptor.forClass(Instant.class);
        verify(metricsRepository).countMealDays(eq(YOU), start.capture(), any());
        // previousOrSame, not previous: on a Monday the week starts today, not a week ago.
        assertThat(start.getValue()).isEqualTo(monday.atStartOfDay(SAO_PAULO).toInstant());
    }

    @Test
    void apairMissionNeedsBothHalvesToReachTheTarget() {
        givenPair();
        givenCatalog(mission("M1", 5, WeeklyMissionScope.PAIR));
        when(metricsRepository.countMealDays(eq(YOU), any(), any())).thenReturn(5);
        when(metricsRepository.countMealDays(eq(PARTNER), any(), any())).thenReturn(4);

        WeeklyMissionProgress progress =
                serviceOn(LocalDate.of(2026, 5, 20)).getCurrentWeek(YOU).get(0);

        // Five of five on one side and four on the other is not a finished pair mission.
        assertThat(progress.isCompleted()).isFalse();
        assertThat(progress.getCurrent()).isEqualTo(5);
        assertThat(progress.getPartnerCurrent()).isEqualTo(4);
        assertThat(progress.getPartnerName()).isEqualTo("Bia");
    }

    @Test
    void apairMissionIsDoneWhenBothSidesGetThere() {
        givenPair();
        givenCatalog(mission("M1", 5, WeeklyMissionScope.PAIR));
        when(metricsRepository.countMealDays(eq(YOU), any(), any())).thenReturn(5);
        when(metricsRepository.countMealDays(eq(PARTNER), any(), any())).thenReturn(6);

        WeeklyMissionProgress progress =
                serviceOn(LocalDate.of(2026, 5, 20)).getCurrentWeek(YOU).get(0);

        // Over the target counts, so the mission does not un-finish itself on a good week.
        assertThat(progress.isCompleted()).isTrue();
    }

    @Test
    void apairMissionWithNobodyToPairWithNeverCompletes() {
        givenUserWithoutPartner();
        givenCatalog(mission("M1", 5, WeeklyMissionScope.PAIR));
        when(metricsRepository.countMealDays(eq(YOU), any(), any())).thenReturn(50);

        WeeklyMissionProgress progress =
                serviceOn(LocalDate.of(2026, 5, 20)).getCurrentWeek(YOU).get(0);

        // Ten times the target alone is still half a pair mission.
        assertThat(progress.isCompleted()).isFalse();
        assertThat(progress.getPartnerName()).isNull();
        assertThat(progress.getPartnerCurrent()).isNull();
    }

    @Test
    void aselfMissionOnlyLooksAtTheCaller() {
        givenPair();
        givenCatalog(mission("M1", 3, WeeklyMissionScope.SELF));
        when(metricsRepository.countMealDays(eq(YOU), any(), any())).thenReturn(3);

        WeeklyMissionProgress progress =
                serviceOn(LocalDate.of(2026, 5, 20)).getCurrentWeek(YOU).get(0);

        assertThat(progress.isCompleted()).isTrue();
        // The partner is not consulted, and not shown: this one is nobody else's business.
        assertThat(progress.getPartnerName()).isNull();
        verify(metricsRepository, org.mockito.Mockito.never()).countMealDays(eq(PARTNER), any(), any());
    }

    @Test
    void eachMetricIsCountedByItsOwnQuery() {
        givenPair();
        givenCatalog(
                mission("MEALS", 5, WeeklyMissionScope.SELF, WeeklyMissionMetric.MEAL_DAYS),
                mission("TRAIN", 3, WeeklyMissionScope.SELF, WeeklyMissionMetric.WORKOUTS));
        when(metricsRepository.countMealDays(eq(YOU), any(), any())).thenReturn(5);
        when(metricsRepository.countWorkouts(eq(YOU), any(), any())).thenReturn(1);

        List<WeeklyMissionProgress> week = serviceOn(LocalDate.of(2026, 5, 20)).getCurrentWeek(YOU);

        assertThat(week).hasSize(2);
        assertThat(week.get(0).isCompleted()).isTrue();
        assertThat(week.get(1).isCompleted()).isFalse();
    }

    private void givenPair() {
        when(userRepository.findById(YOU))
                .thenReturn(Optional.of(User.builder()
                        .id(YOU)
                        .tenantId(TENANT)
                        .name("Alisson")
                        .timeZone(SAO_PAULO)
                        .build()));
        when(userRepository.findById(PARTNER))
                .thenReturn(Optional.of(User.builder()
                        .id(PARTNER)
                        .tenantId(TENANT)
                        .name("Bia Souto")
                        .timeZone(SAO_PAULO)
                        .build()));
        when(pairRepository.findById(TENANT))
                .thenReturn(Optional.of(Pair.builder()
                        .id(TENANT)
                        .user1Id(YOU)
                        .user2Id(PARTNER)
                        .status(PairStatus.ACTIVE)
                        .build()));
    }

    private void givenUserWithoutPartner() {
        when(userRepository.findById(YOU))
                .thenReturn(Optional.of(User.builder()
                        .id(YOU)
                        .tenantId(TENANT)
                        .name("Alisson")
                        .timeZone(SAO_PAULO)
                        .build()));
        when(pairRepository.findById(TENANT))
                .thenReturn(Optional.of(Pair.builder()
                        .id(TENANT)
                        .user1Id(YOU)
                        .user2Id(null)
                        .status(PairStatus.PENDING)
                        .build()));
    }

    private void givenCatalog(WeeklyMission... missions) {
        when(catalogRepository.findAllOrdered()).thenReturn(List.of(missions));
    }

    private static WeeklyMission mission(String code, int target, WeeklyMissionScope scope) {
        return mission(code, target, scope, WeeklyMissionMetric.MEAL_DAYS);
    }

    private static WeeklyMission mission(
            String code, int target, WeeklyMissionScope scope, WeeklyMissionMetric metric) {
        return WeeklyMission.builder()
                .code(code)
                .title("Missão " + code)
                .subtitle("Semana de " + code)
                .reward(50)
                .target(target)
                .metric(metric)
                .scope(scope)
                .build();
    }
}
