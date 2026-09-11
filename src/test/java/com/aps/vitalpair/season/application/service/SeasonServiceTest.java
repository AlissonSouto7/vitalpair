package com.aps.vitalpair.season.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Clock;
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

import com.aps.vitalpair.pair.domain.model.Pair;
import com.aps.vitalpair.pair.domain.model.PairStatus;
import com.aps.vitalpair.pair.domain.port.out.PairRepositoryPort;
import com.aps.vitalpair.season.domain.model.PointEvent;
import com.aps.vitalpair.season.domain.model.PointSource;
import com.aps.vitalpair.season.domain.model.Season;
import com.aps.vitalpair.season.domain.model.SeasonStatus;
import com.aps.vitalpair.season.domain.port.out.PointEventRepositoryPort;
import com.aps.vitalpair.season.domain.port.out.SeasonRepositoryPort;
import com.aps.vitalpair.season.domain.port.out.projection.UserPoints;
import com.aps.vitalpair.user.domain.port.out.UserRepositoryPort;

/**
 * The season's lifecycle, which had no unit test because the service read the JVM's own zone
 * from a static field and a test cannot move that.
 *
 * <p>Now that the clock is injected, the interesting moments are reachable: the day a season
 * expires, the day after, and a pair that comes back after months away and has to roll through
 * several seasons at once.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class SeasonServiceTest {

    private static final ZoneId SAO_PAULO = ZoneId.of("America/Sao_Paulo");
    private static final UUID TENANT = UUID.randomUUID();
    private static final UUID YOU = UUID.randomUUID();
    private static final UUID RIVAL = UUID.randomUUID();

    @Mock
    private SeasonRepositoryPort seasonRepository;

    @Mock
    private PointEventRepositoryPort pointEventRepository;

    @Mock
    private PairRepositoryPort pairRepository;

    @Mock
    private UserRepositoryPort userRepository;

    /** A service whose today is the given date, in the product's zone. */
    private SeasonService serviceOn(LocalDate today) {
        Clock fixed = Clock.fixed(today.atTime(12, 0).atZone(SAO_PAULO).toInstant(), SAO_PAULO);
        return new SeasonService(
                seasonRepository, pointEventRepository, pairRepository, userRepository, fixed, SAO_PAULO.getId());
    }

    @Test
    void theFirstSeasonStartsTheDayThePairDid() {
        LocalDate pairedOn = LocalDate.of(2026, 3, 10);
        when(seasonRepository.findActiveByTenant(TENANT)).thenReturn(Optional.empty());
        when(seasonRepository.save(any())).thenAnswer(call -> call.getArgument(0));

        serviceOn(pairedOn.plusDays(5)).ensureCurrentSeason(pairOn(pairedOn));

        Season created = savedSeasons().get(0);
        assertThat(created.getNumber()).isEqualTo(1);
        assertThat(created.getStartDate()).isEqualTo(pairedOn);
        // Thirty days, and end_date is the day after the last one: [start, end).
        assertThat(created.getEndDate()).isEqualTo(pairedOn.plusDays(30));
        assertThat(created.getStatus()).isEqualTo(SeasonStatus.ACTIVE);
    }

    @Test
    void aseasonSurvivesItsLastDay() {
        LocalDate start = LocalDate.of(2026, 3, 1);
        Season active = season(1, start, start.plusDays(30));
        when(seasonRepository.findActiveByTenant(TENANT)).thenReturn(Optional.of(active));

        // The last day a season covers is end_date minus one, and on it nothing rolls over.
        Season current = serviceOn(start.plusDays(29)).ensureCurrentSeason(pairOn(start));

        assertThat(current).isSameAs(active);
        verify(seasonRepository, never()).save(any());
    }

    @Test
    void thedayTheSeasonEndsTheNextOneOpens() {
        LocalDate start = LocalDate.of(2026, 3, 1);
        LocalDate end = start.plusDays(30);
        when(seasonRepository.findActiveByTenant(TENANT)).thenReturn(Optional.of(season(1, start, end)));
        when(seasonRepository.save(any())).thenAnswer(call -> call.getArgument(0));
        when(pointEventRepository.sumByUser(any(), any(), any()))
                .thenReturn(List.of(new UserPoints(YOU, 120L), new UserPoints(RIVAL, 90L)));

        Season current = serviceOn(end).ensureCurrentSeason(pairOn(start));

        List<Season> saved = savedSeasons();
        assertThat(saved.get(0).getStatus()).isEqualTo(SeasonStatus.CLOSED);
        // The winner comes from the ledger, not from a scoreboard snapshot that may disagree.
        assertThat(saved.get(0).getWinnerUserId()).isEqualTo(YOU);
        assertThat(current.getNumber()).isEqualTo(2);
        // The new season starts exactly where the old one ended: no gap, no overlap.
        assertThat(current.getStartDate()).isEqualTo(end);
        assertThat(current.getStatus()).isEqualTo(SeasonStatus.ACTIVE);
    }

    @Test
    void apairThatDisappearsForMonthsRollsThroughEverySeasonItMissed() {
        LocalDate start = LocalDate.of(2026, 1, 1);
        when(seasonRepository.findActiveByTenant(TENANT)).thenReturn(Optional.of(season(1, start, start.plusDays(30))));
        when(seasonRepository.save(any())).thenAnswer(call -> call.getArgument(0));
        when(pointEventRepository.sumByUser(any(), any(), any())).thenReturn(List.of());

        // Ninety days later: seasons 1, 2 and 3 are all over. Four saves, three of them
        // closing a season and three opening one, with the last open season covering today.
        Season current = serviceOn(start.plusDays(95)).ensureCurrentSeason(pairOn(start));

        assertThat(current.getNumber()).isEqualTo(4);
        assertThat(current.getStartDate()).isEqualTo(start.plusDays(90));
        assertThat(current.getEndDate()).isAfter(start.plusDays(95));
        verify(seasonRepository, times(6)).save(any());
    }

    @Test
    void aseasonWithNoPointsClosesWithoutAwinner() {
        LocalDate start = LocalDate.of(2026, 3, 1);
        LocalDate end = start.plusDays(30);
        when(seasonRepository.findActiveByTenant(TENANT)).thenReturn(Optional.of(season(1, start, end)));
        when(seasonRepository.save(any())).thenAnswer(call -> call.getArgument(0));
        when(pointEventRepository.sumByUser(any(), any(), any())).thenReturn(List.of());

        serviceOn(end).ensureCurrentSeason(pairOn(start));

        // A tie at zero is not a win for whoever the query happened to return first.
        assertThat(savedSeasons().get(0).getWinnerUserId()).isNull();
    }

    @Test
    void thenextSeasonKeepsTheStakeThePairAgreedOn() {
        LocalDate start = LocalDate.of(2026, 3, 1);
        LocalDate end = start.plusDays(30);
        Season active = season(1, start, end).toBuilder()
                .stake("Quem perder lava a louça")
                .build();
        when(seasonRepository.findActiveByTenant(TENANT)).thenReturn(Optional.of(active));
        when(seasonRepository.save(any())).thenAnswer(call -> call.getArgument(0));
        when(pointEventRepository.sumByUser(any(), any(), any())).thenReturn(List.of());

        Season current = serviceOn(end).ensureCurrentSeason(pairOn(start));

        // Rolling over is not a reason to make somebody agree a bet again.
        assertThat(current.getStake()).isEqualTo("Quem perder lava a louça");
    }

    @Test
    void apointIsFiledAtTheStartOfItsDayInTheProductsZone() {
        serviceOn(LocalDate.of(2026, 3, 10)).record(TENANT, YOU, PointSource.MEAL, 10, LocalDate.of(2026, 3, 9));

        ArgumentCaptor<PointEvent> event = ArgumentCaptor.forClass(PointEvent.class);
        verify(pointEventRepository).save(event.capture());
        // Midnight in Sao Paulo, which is 03:00 UTC. Taking the JVM's zone here is what made
        // the season disagree with the meals it counts (S-7).
        assertThat(event.getValue().getOccurredAt())
                .isEqualTo(LocalDate.of(2026, 3, 9).atStartOfDay(SAO_PAULO).toInstant());
        assertThat(event.getValue().getPoints()).isEqualTo(10);
        assertThat(event.getValue().getSource()).isEqualTo(PointSource.MEAL);
    }

    private List<Season> savedSeasons() {
        ArgumentCaptor<Season> saved = ArgumentCaptor.forClass(Season.class);
        verify(seasonRepository, org.mockito.Mockito.atLeastOnce()).save(saved.capture());
        return saved.getAllValues();
    }

    private static Pair pairOn(LocalDate created) {
        return Pair.builder()
                .id(TENANT)
                .user1Id(YOU)
                .user2Id(RIVAL)
                .status(PairStatus.ACTIVE)
                .createdAt(created.atStartOfDay(SAO_PAULO).toInstant())
                .build();
    }

    private static Season season(int number, LocalDate start, LocalDate end) {
        return Season.builder()
                .id(UUID.randomUUID())
                .tenantId(TENANT)
                .number(number)
                .startDate(start)
                .endDate(end)
                .stake("Quem perder paga o jantar")
                .status(SeasonStatus.ACTIVE)
                .build();
    }
}
