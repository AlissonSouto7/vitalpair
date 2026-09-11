package com.aps.vitalpair.season.application.service;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.aps.vitalpair.pair.domain.model.Pair;
import com.aps.vitalpair.pair.domain.port.out.PairRepositoryPort;
import com.aps.vitalpair.season.application.dto.SeasonView;
import com.aps.vitalpair.season.domain.model.PointEvent;
import com.aps.vitalpair.season.domain.model.PointSource;
import com.aps.vitalpair.season.domain.model.Season;
import com.aps.vitalpair.season.domain.model.SeasonStatus;
import com.aps.vitalpair.season.domain.port.in.GetSeasonUseCase;
import com.aps.vitalpair.season.domain.port.in.RecordPointUseCase;
import com.aps.vitalpair.season.domain.port.in.UpdateStakeUseCase;
import com.aps.vitalpair.season.domain.port.out.PointEventRepositoryPort;
import com.aps.vitalpair.season.domain.port.out.SeasonRepositoryPort;
import com.aps.vitalpair.season.domain.port.out.projection.DayUserPoints;
import com.aps.vitalpair.season.domain.port.out.projection.SourceUserPoints;
import com.aps.vitalpair.season.domain.port.out.projection.UserPoints;
import com.aps.vitalpair.shared.exception.ResourceNotFoundException;
import com.aps.vitalpair.user.domain.model.User;
import com.aps.vitalpair.user.domain.port.out.UserRepositoryPort;

/**
 * The thirty-day season, plus reading the points ledger.
 *
 * <p>LAZY lifecycle: {@link #ensureCurrentSeason(Pair)} creates, closes and opens seasons on
 * demand, with no scheduler. Points are NEVER read from the scoreboard snapshot: they are always
 * summed from the ledger ({@code point_events}) over the season's window, which is what keeps
 * them consistent with the competition.
 */
@Service
public class SeasonService implements GetSeasonUseCase, RecordPointUseCase, UpdateStakeUseCase {

    private static final int SEASON_DAYS = 30;
    private static final String DEFAULT_STAKE = "Quem perder paga o jantar";
    private static final DateTimeFormatter DAY_MONTH = DateTimeFormatter.ofPattern("dd/MM");

    private final SeasonRepositoryPort seasonRepository;
    private final PointEventRepositoryPort pointEventRepository;
    private final PairRepositoryPort pairRepository;
    private final UserRepositoryPort userRepository;

    /**
     * Where and when the season's day begins.
     *
     * <p>This used to be {@code ZoneId.systemDefault()} in a static field, which is how S-7
     * happened: the season took its day from the JVM while meals took theirs from the person,
     * and four integration tests failed every night between 21:00 and midnight in Brazil. The
     * deploy pins the container's zone, which stops the bleeding; a clock the caller provides
     * is what makes the rule testable at all, because a static default cannot be moved to
     * the last second of a season to see what the code does there.
     */
    private final Clock clock;

    public SeasonService(
            SeasonRepositoryPort seasonRepository,
            PointEventRepositoryPort pointEventRepository,
            PairRepositoryPort pairRepository,
            UserRepositoryPort userRepository,
            Clock clock,
            @Value("${vitalpair.scheduling.zone}") String zone) {
        this.seasonRepository = seasonRepository;
        this.pointEventRepository = pointEventRepository;
        this.pairRepository = pairRepository;
        this.userRepository = userRepository;
        // The shared clock is UTC, because an instant has no zone. A season counts days, so
        // it reads that clock in the product's own zone, the same one the schedulers use.
        // Taking the bean as-is would move every season boundary three hours and bring S-7
        // back; taking the JVM default is what caused S-7 in the first place.
        this.clock = clock.withZone(ZoneId.of(zone));
    }

    /** The zone the season counts its days in, taken from the clock. */
    private ZoneId zone() {
        return clock.getZone();
    }

    // ------------------------------------------------------------------ ledger

    @Override
    @Transactional
    public void record(UUID tenantId, UUID userId, PointSource source, int points, LocalDate date) {
        pointEventRepository.save(PointEvent.builder()
                .tenantId(tenantId)
                .userId(userId)
                .occurredAt(date.atStartOfDay(zone()).toInstant())
                .source(source)
                .points(points)
                .build());
    }

    // ------------------------------------------------------------------- view

    @Override
    @Transactional
    public SeasonView getCurrentSeason(UUID userId) {
        User me = userRepository.findById(userId).orElseThrow(() -> ResourceNotFoundException.of("Usuário", userId));
        Pair pair = pairRepository
                .findById(me.getTenantId())
                .orElseThrow(() -> ResourceNotFoundException.of("Par", me.getTenantId()));

        Season season = ensureCurrentSeason(pair);
        UUID rivalId = partnerId(pair, userId);
        boolean hasPartner = rivalId != null;

        LocalDate today = LocalDate.now(clock);
        Instant winStart = season.getStartDate().atStartOfDay(zone()).toInstant();
        Instant winEnd = today.plusDays(1).atStartOfDay(zone()).toInstant();

        // Totals per user from the ledger over the active season's window.
        Map<UUID, Long> totals = pointEventRepository.sumByUser(pair.getId(), winStart, winEnd).stream()
                .collect(Collectors.toMap(UserPoints::userId, UserPoints::points));
        int youScore = points(totals, userId);
        int rivalScore = hasPartner ? points(totals, rivalId) : 0;

        int dayNumber = dayNumber(season.getStartDate(), today);
        int daysLeft = Math.max(0, (int) (season.getEndDate().toEpochDay() - today.toEpochDay()));

        SeasonView.Side you = new SeasonView.Side(firstName(userId), youScore);
        SeasonView.Side rival = hasPartner ? new SeasonView.Side(firstName(rivalId), rivalScore) : null;

        List<SeasonView.DayScore> days =
                buildDays(season.getStartDate(), today, pair.getId(), winStart, winEnd, userId, rivalId);
        List<SeasonView.BreakdownRow> breakdown =
                buildBreakdown(pair.getId(), winStart, winEnd, userId, rivalId, hasPartner);
        List<SeasonView.HistoryRow> history = buildHistory(pair.getId(), userId, rivalId, hasPartner);

        return new SeasonView(
                season.getNumber(),
                dayNumber,
                SEASON_DAYS,
                daysLeft,
                season.getStake(),
                hasPartner,
                you,
                rival,
                days,
                breakdown,
                history);
    }

    @Override
    @Transactional
    public SeasonView updateStake(UUID userId, String stake) {
        User me = userRepository.findById(userId).orElseThrow(() -> ResourceNotFoundException.of("Usuário", userId));
        Pair pair = pairRepository
                .findById(me.getTenantId())
                .orElseThrow(() -> ResourceNotFoundException.of("Par", me.getTenantId()));
        Season season = ensureCurrentSeason(pair);
        seasonRepository.save(season.toBuilder().stake(stake).build());
        return getCurrentSeason(userId);
    }

    // ------------------------------------------------------------- lifecycle

    /**
     * Guarantees an ACTIVE season covering today. Creates the first when there is none, and
     * closes and opens in a chain while the ACTIVE one has expired (end_date in the past).
     */
    @Transactional
    public Season ensureCurrentSeason(Pair pair) {
        Season active = seasonRepository.findActiveByTenant(pair.getId()).orElse(null);
        if (active == null) {
            LocalDate start = pair.getCreatedAt() != null
                    ? pair.getCreatedAt().atZone(zone()).toLocalDate()
                    : LocalDate.now(clock);
            active = seasonRepository.save(Season.builder()
                    .tenantId(pair.getId())
                    .number(1)
                    .startDate(start)
                    .endDate(start.plusDays(SEASON_DAYS))
                    .stake(initialStake(pair))
                    .status(SeasonStatus.ACTIVE)
                    .build());
        }

        LocalDate today = LocalDate.now(clock);
        // end_date is exclusive: a season covers [start, end). Expired when today >= end.
        while (!today.isBefore(active.getEndDate())) {
            active = rollOver(active);
        }
        return active;
    }

    /** Closes the expired season (the winner comes from the ledger) and opens the next. */
    private Season rollOver(Season ended) {
        Instant winStart = ended.getStartDate().atStartOfDay(zone()).toInstant();
        Instant winEnd = ended.getEndDate().atStartOfDay(zone()).toInstant();
        UUID winner = winnerByLedger(ended.getTenantId(), winStart, winEnd);

        seasonRepository.save(ended.toBuilder()
                .status(SeasonStatus.CLOSED)
                .winnerUserId(winner)
                .build());

        LocalDate nextStart = ended.getEndDate();
        return seasonRepository.save(Season.builder()
                .tenantId(ended.getTenantId())
                .number(ended.getNumber() + 1)
                .startDate(nextStart)
                .endDate(nextStart.plusDays(SEASON_DAYS))
                .stake(ended.getStake())
                .status(SeasonStatus.ACTIVE)
                .build());
    }

    // --------------------------------------------------------------- helpers

    private List<SeasonView.DayScore> buildDays(
            LocalDate start,
            LocalDate today,
            UUID tenantId,
            Instant winStart,
            Instant winEnd,
            UUID youId,
            UUID rivalId) {
        List<DayUserPoints> rows = pointEventRepository.sumByDayAndUser(tenantId, winStart, winEnd);
        Map<LocalDate, Map<UUID, Long>> byDay = rows.stream()
                .collect(Collectors.groupingBy(
                        DayUserPoints::day, Collectors.toMap(DayUserPoints::userId, DayUserPoints::points)));

        List<SeasonView.DayScore> days = new ArrayList<>();
        LocalDate cursor = start;
        int label = 1;
        while (!cursor.isAfter(today)) {
            Map<UUID, Long> dayTotals = byDay.getOrDefault(cursor, Map.of());
            int you = points(dayTotals, youId);
            int rival = rivalId != null ? points(dayTotals, rivalId) : 0;
            days.add(new SeasonView.DayScore(String.valueOf(label), you, rival));
            cursor = cursor.plusDays(1);
            label++;
        }
        return days;
    }

    private List<SeasonView.BreakdownRow> buildBreakdown(
            UUID tenantId, Instant winStart, Instant winEnd, UUID youId, UUID rivalId, boolean hasPartner) {
        List<SourceUserPoints> rows = pointEventRepository.sumBySourceAndUser(tenantId, winStart, winEnd);
        Map<PointSource, Map<UUID, Long>> bySource = rows.stream()
                .collect(Collectors.groupingBy(
                        SourceUserPoints::source,
                        Collectors.toMap(SourceUserPoints::userId, SourceUserPoints::points)));

        List<SeasonView.BreakdownRow> breakdown = new ArrayList<>();
        // Fixed order: meals, workouts, streaks, missions.
        for (PointSource source :
                List.of(PointSource.MEAL, PointSource.ACTIVITY, PointSource.STREAK, PointSource.MISSION)) {
            Map<UUID, Long> totals = bySource.getOrDefault(source, Map.of());
            int you = points(totals, youId);
            int rival = hasPartner && rivalId != null ? points(totals, rivalId) : 0;
            if (you > 0 || rival > 0) {
                breakdown.add(new SeasonView.BreakdownRow(source.name(), label(source), you, rival));
            }
        }
        return breakdown;
    }

    private List<SeasonView.HistoryRow> buildHistory(UUID tenantId, UUID youId, UUID rivalId, boolean hasPartner) {
        List<Season> closed = seasonRepository.findByTenantAndStatusOrderByNumberDesc(tenantId, SeasonStatus.CLOSED);
        List<SeasonView.HistoryRow> history = new ArrayList<>();
        for (Season s : closed) {
            Instant winStart = s.getStartDate().atStartOfDay(zone()).toInstant();
            Instant winEnd = s.getEndDate().atStartOfDay(zone()).toInstant();
            Map<UUID, Long> totals = pointEventRepository.sumByUser(tenantId, winStart, winEnd).stream()
                    .collect(Collectors.toMap(UserPoints::userId, UserPoints::points));
            int you = points(totals, youId);
            int rival = hasPartner && rivalId != null ? points(totals, rivalId) : 0;
            String winner = you > rival ? "YOU" : (rival > you ? "RIVAL" : "TIE");
            String sub = SEASON_DAYS + " dias · fechou em " + s.getEndDate().format(DAY_MONTH);
            history.add(new SeasonView.HistoryRow(s.getNumber(), sub, you, rival, winner, s.getStake()));
        }
        return history;
    }

    private UUID winnerByLedger(UUID tenantId, Instant start, Instant end) {
        List<UserPoints> totals = pointEventRepository.sumByUser(tenantId, start, end);
        UUID winner = null;
        long best = Long.MIN_VALUE;
        boolean tie = false;
        for (UserPoints up : totals) {
            if (up.points() > best) {
                best = up.points();
                winner = up.userId();
                tie = false;
            } else if (up.points() == best) {
                tie = true;
            }
        }
        return tie ? null : winner;
    }

    private String initialStake(Pair pair) {
        // Onboarding does not store a stake on the pair yet; the default applies.
        return DEFAULT_STAKE;
    }

    private UUID partnerId(Pair pair, UUID userId) {
        if (userId.equals(pair.getUser1Id())) {
            return pair.getUser2Id();
        }
        if (userId.equals(pair.getUser2Id())) {
            return pair.getUser1Id();
        }
        return null;
    }

    private String firstName(UUID userId) {
        return userRepository
                .findById(userId)
                .map(User::getName)
                .map(name -> name.trim().split("\\s+")[0])
                .orElse("");
    }

    private int dayNumber(LocalDate start, LocalDate today) {
        long elapsed = today.toEpochDay() - start.toEpochDay() + 1;
        return (int) Math.min(Math.max(elapsed, 1), SEASON_DAYS);
    }

    private int points(Map<UUID, Long> totals, UUID userId) {
        if (userId == null) {
            return 0;
        }
        return totals.getOrDefault(userId, 0L).intValue();
    }

    private String label(PointSource source) {
        return switch (source) {
            case MEAL -> "Refeições";
            case ACTIVITY -> "Treinos";
            case STREAK -> "Sequências";
            case MISSION -> "Missões";
        };
    }
}
