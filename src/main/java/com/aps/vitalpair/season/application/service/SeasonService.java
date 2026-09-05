package com.aps.vitalpair.season.application.service;

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
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Sistema de temporada (30 dias) + leitura do ledger de pontos.
 *
 * <p>Lifecycle LAZY: {@link #ensureCurrentSeason(Pair)} cria/fecha/abre temporadas sob demanda,
 * sem scheduler. Pontos NUNCA são lidos do snapshot do placar: são sempre somados do ledger
 * ({@code point_events}) na janela da temporada, garantindo consistência com a competição.
 */
@Service
public class SeasonService implements GetSeasonUseCase, RecordPointUseCase, UpdateStakeUseCase {

    private static final int SEASON_DAYS = 30;
    private static final String DEFAULT_STAKE = "Quem perder paga o jantar";
    private static final ZoneId ZONE = ZoneId.systemDefault();
    private static final DateTimeFormatter DAY_MONTH = DateTimeFormatter.ofPattern("dd/MM");

    private final SeasonRepositoryPort seasonRepository;
    private final PointEventRepositoryPort pointEventRepository;
    private final PairRepositoryPort pairRepository;
    private final UserRepositoryPort userRepository;

    public SeasonService(
            SeasonRepositoryPort seasonRepository,
            PointEventRepositoryPort pointEventRepository,
            PairRepositoryPort pairRepository,
            UserRepositoryPort userRepository) {
        this.seasonRepository = seasonRepository;
        this.pointEventRepository = pointEventRepository;
        this.pairRepository = pairRepository;
        this.userRepository = userRepository;
    }

    // ------------------------------------------------------------------ ledger

    @Override
    @Transactional
    public void record(UUID tenantId, UUID userId, PointSource source, int points, LocalDate date) {
        pointEventRepository.save(PointEvent.builder()
                .tenantId(tenantId)
                .userId(userId)
                .occurredAt(date.atStartOfDay(ZONE).toInstant())
                .source(source)
                .points(points)
                .build());
    }

    // ------------------------------------------------------------------- view

    @Override
    @Transactional
    public SeasonView getCurrentSeason(UUID userId) {
        User me = userRepository.findById(userId)
                .orElseThrow(() -> ResourceNotFoundException.of("Usuário", userId));
        Pair pair = pairRepository.findById(me.getTenantId())
                .orElseThrow(() -> ResourceNotFoundException.of("Par", me.getTenantId()));

        Season season = ensureCurrentSeason(pair);
        UUID rivalId = partnerId(pair, userId);
        boolean hasPartner = rivalId != null;

        LocalDate today = LocalDate.now(ZONE);
        Instant winStart = season.getStartDate().atStartOfDay(ZONE).toInstant();
        Instant winEnd = today.plusDays(1).atStartOfDay(ZONE).toInstant();

        // Totais por usuário no ledger da janela da temporada ativa.
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
                season.getNumber(), dayNumber, SEASON_DAYS, daysLeft, season.getStake(),
                hasPartner, you, rival, days, breakdown, history);
    }

    @Override
    @Transactional
    public SeasonView updateStake(UUID userId, String stake) {
        User me = userRepository.findById(userId)
                .orElseThrow(() -> ResourceNotFoundException.of("Usuário", userId));
        Pair pair = pairRepository.findById(me.getTenantId())
                .orElseThrow(() -> ResourceNotFoundException.of("Par", me.getTenantId()));
        Season season = ensureCurrentSeason(pair);
        seasonRepository.save(season.toBuilder().stake(stake).build());
        return getCurrentSeason(userId);
    }

    // ------------------------------------------------------------- lifecycle

    /**
     * Garante uma temporada ACTIVE cobrindo hoje. Cria a primeira se não houver, e fecha/abre em
     * cadeia enquanto a ACTIVE estiver vencida (end_date no passado).
     */
    @Transactional
    public Season ensureCurrentSeason(Pair pair) {
        Season active = seasonRepository.findActiveByTenant(pair.getId()).orElse(null);
        if (active == null) {
            LocalDate start = pair.getCreatedAt() != null
                    ? pair.getCreatedAt().atZone(ZONE).toLocalDate()
                    : LocalDate.now(ZONE);
            active = seasonRepository.save(Season.builder()
                    .tenantId(pair.getId())
                    .number(1)
                    .startDate(start)
                    .endDate(start.plusDays(SEASON_DAYS))
                    .stake(initialStake(pair))
                    .status(SeasonStatus.ACTIVE)
                    .build());
        }

        LocalDate today = LocalDate.now(ZONE);
        // end_date é exclusivo: a temporada cobre [start, end). Vencida quando hoje >= end.
        while (!today.isBefore(active.getEndDate())) {
            active = rollOver(active);
        }
        return active;
    }

    /** Fecha a temporada vencida (define vencedor pelo ledger) e abre a próxima. */
    private Season rollOver(Season ended) {
        Instant winStart = ended.getStartDate().atStartOfDay(ZONE).toInstant();
        Instant winEnd = ended.getEndDate().atStartOfDay(ZONE).toInstant();
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
            LocalDate start, LocalDate today, UUID tenantId,
            Instant winStart, Instant winEnd, UUID youId, UUID rivalId) {
        List<DayUserPoints> rows = pointEventRepository.sumByDayAndUser(tenantId, winStart, winEnd);
        Map<LocalDate, Map<UUID, Long>> byDay = rows.stream().collect(Collectors.groupingBy(
                DayUserPoints::day,
                Collectors.toMap(DayUserPoints::userId, DayUserPoints::points)));

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
        Map<PointSource, Map<UUID, Long>> bySource = rows.stream().collect(Collectors.groupingBy(
                SourceUserPoints::source,
                Collectors.toMap(SourceUserPoints::userId, SourceUserPoints::points)));

        List<SeasonView.BreakdownRow> breakdown = new ArrayList<>();
        // Ordem fixa: refeições, treinos, sequências, missões.
        for (PointSource source : List.of(
                PointSource.MEAL, PointSource.ACTIVITY, PointSource.STREAK, PointSource.MISSION)) {
            Map<UUID, Long> totals = bySource.getOrDefault(source, Map.of());
            int you = points(totals, youId);
            int rival = hasPartner && rivalId != null ? points(totals, rivalId) : 0;
            if (you > 0 || rival > 0) {
                breakdown.add(new SeasonView.BreakdownRow(source.name(), label(source), you, rival));
            }
        }
        return breakdown;
    }

    private List<SeasonView.HistoryRow> buildHistory(
            UUID tenantId, UUID youId, UUID rivalId, boolean hasPartner) {
        List<Season> closed =
                seasonRepository.findByTenantAndStatusOrderByNumberDesc(tenantId, SeasonStatus.CLOSED);
        List<SeasonView.HistoryRow> history = new ArrayList<>();
        for (Season s : closed) {
            Instant winStart = s.getStartDate().atStartOfDay(ZONE).toInstant();
            Instant winEnd = s.getEndDate().atStartOfDay(ZONE).toInstant();
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
        // O onboarding ainda não persiste uma aposta no par; usa o padrão.
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
        return userRepository.findById(userId)
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
