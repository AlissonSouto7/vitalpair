package com.aps.vitalpair.progress.application.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.aps.vitalpair.progress.domain.model.CalorieDay;
import com.aps.vitalpair.progress.domain.model.DailyNutritionTotals;
import com.aps.vitalpair.progress.domain.model.MacroAverage;
import com.aps.vitalpair.progress.domain.model.ProgressView;
import com.aps.vitalpair.progress.domain.model.ProgressWindow;
import com.aps.vitalpair.progress.domain.model.WeightPoint;
import com.aps.vitalpair.progress.domain.port.in.GetProgressUseCase;
import com.aps.vitalpair.progress.domain.port.in.RecordWeightUseCase;
import com.aps.vitalpair.progress.domain.port.out.NutritionMetricsPort;
import com.aps.vitalpair.progress.domain.port.out.WeightLogRepositoryPort;
import com.aps.vitalpair.shared.event.WeightLoggedEvent;
import com.aps.vitalpair.shared.exception.ResourceNotFoundException;
import com.aps.vitalpair.user.domain.model.User;
import com.aps.vitalpair.user.domain.model.UserTimeZones;
import com.aps.vitalpair.user.domain.port.out.UserRepositoryPort;

/**
 * Use cases of the Progress screen. Weight history comes from {@code weight_logs}; calories and
 * macros from aggregates of {@code food_logs}; the targets (calories and macros) from the
 * user's profile, already computed by the TDEE feature.
 */
@Service
public class ProgressService implements GetProgressUseCase, RecordWeightUseCase {

    /**
     * A ceiling on the weight points returned, so a long window cannot become an unbounded
     * query. One a day over ninety days is the most anybody can produce.
     */
    private static final int WEIGHT_HISTORY_CAP = 100;

    private final WeightLogRepositoryPort weightLogRepository;
    private final NutritionMetricsPort nutritionMetrics;
    private final UserRepositoryPort userRepository;
    private final ApplicationEventPublisher eventPublisher;

    public ProgressService(
            WeightLogRepositoryPort weightLogRepository,
            NutritionMetricsPort nutritionMetrics,
            UserRepositoryPort userRepository,
            ApplicationEventPublisher eventPublisher) {
        this.weightLogRepository = weightLogRepository;
        this.nutritionMetrics = nutritionMetrics;
        this.userRepository = userRepository;
        this.eventPublisher = eventPublisher;
    }

    @Override
    @Transactional
    public void recordTodayWeight(UUID userId, BigDecimal weightKg) {
        // Not orElseThrow: an unreadable profile must not stop the weighing from being saved.
        // The caller is authenticated, so a miss means the account closed mid-request, and
        // the write reports that more honestly than a 404 about the date would. Same reason
        // zoneOf falls back instead of throwing.
        User user = userRepository.findById(userId).orElse(null);

        // Read BEFORE the upsert. On the very first weighing the upsert would become the
        // earliest record itself, and the badge would be measured against the number that
        // had just been typed: a change of zero, forever.
        BigDecimal startWeight = weightLogRepository.findStartWeight(userId).orElse(null);

        // Today where the person is. LocalDate.now() would file a weigh-in taken after 21:00
        // in Brazil under tomorrow, and overwrite tomorrow's real entry when it arrives.
        LocalDate today = LocalDate.now(user != null ? user.zone() : UserTimeZones.FALLBACK);
        weightLogRepository.upsert(userId, today, weightKg);

        // No profile means no goal to measure against, so there is no badge to award and
        // nothing for a consumer to do with the event.
        if (user != null) {
            eventPublisher.publishEvent(
                    new WeightLoggedEvent(userId, user.getTenantId(), today, startWeight, weightKg));
        }
    }

    @Override
    @Transactional(readOnly = true)
    public ProgressView getProgress(UUID userId, ProgressWindow window) {
        User user = userRepository.findById(userId).orElseThrow(() -> ResourceNotFoundException.of("Usuário", userId));

        LocalDate today = LocalDate.now(user.zone());
        LocalDate from = today.minusDays(window.days() - 1L);

        List<WeightPoint> weights = buildWeights(userId, user, today, window);
        Integer targetKcal = user.getDailyCalorieTarget();

        Map<LocalDate, DailyNutritionTotals> totalsByDate =
                nutritionMetrics.findDailyTotals(userId, from, today, user.zone()).stream()
                        .collect(Collectors.toMap(DailyNutritionTotals::date, Function.identity()));

        List<CalorieDay> calories = window.isGroupedByWeek()
                ? buildCalorieWeeks(from, today, targetKcal, totalsByDate)
                : buildCalorieDays(from, today, targetKcal, totalsByDate);
        List<MacroAverage> macros = buildMacroAverages(totalsByDate.values(), user, window);

        return new ProgressView(weights, targetKcal, calories, macros);
    }

    private List<WeightPoint> buildWeights(UUID userId, User user, LocalDate today, ProgressWindow window) {
        // One weighing a day is the most the API accepts, so the length of the window is the
        // natural limit. Capped anyway, because the limit belongs to the query rather than to
        // an assumption about how people behave.
        int limit = Math.min(window.days(), WEIGHT_HISTORY_CAP);
        List<WeightPoint> weights = weightLogRepository.findRecentByUser(userId, limit);
        if (weights.isEmpty() && user.getWeightKg() != null) {
            return List.of(new WeightPoint(today, user.getWeightKg()));
        }
        return weights;
    }

    private List<CalorieDay> buildCalorieDays(
            LocalDate from, LocalDate today, Integer targetKcal, Map<LocalDate, DailyNutritionTotals> totalsByDate) {
        List<CalorieDay> days = new ArrayList<>();
        for (LocalDate date = from; !date.isAfter(today); date = date.plusDays(1)) {
            DailyNutritionTotals totals = totalsByDate.get(date);
            int kcal = totals != null ? totals.kcal() : 0;
            boolean withinGoal = targetKcal == null || kcal <= targetKcal;
            days.add(new CalorieDay(date, kcal, withinGoal));
        }
        return days;
    }

    /**
     * The daily averages over the window.
     *
     * <p>No label: the key is what the screen translates, the same way it already translates a
     * badge by its code. These labels used to be built here as "Proteína", "Carboidrato" and
     * "Gordura", which put Portuguese words under an English chart.
     */
    private List<MacroAverage> buildMacroAverages(
            java.util.Collection<DailyNutritionTotals> totals, User user, ProgressWindow window) {
        return List.of(
                new MacroAverage(
                        "PROTEIN", avg(totals, DailyNutritionTotals::proteinG, window), user.getProteinTargetG()),
                new MacroAverage("CARB", avg(totals, DailyNutritionTotals::carbG, window), user.getCarbTargetG()),
                new MacroAverage("FAT", avg(totals, DailyNutritionTotals::fatG, window), user.getFatTargetG()));
    }

    /**
     * The period average: the macro summed over the days that have records, divided by every
     * day in the window.
     *
     * <p>Dividing by the days with records instead would flatter whoever logs rarely: three
     * days of eating in a month would average as though the other twenty-seven never happened.
     */
    private static int avg(
            java.util.Collection<DailyNutritionTotals> totals,
            java.util.function.ToIntFunction<DailyNutritionTotals> field,
            ProgressWindow window) {
        int sum = totals.stream().filter(Objects::nonNull).mapToInt(field).sum();
        return Math.round((float) sum / window.days());
    }

    /**
     * The calorie chart grouped into weeks, which is what the ninety-day window shows.
     *
     * <p>Ninety daily bars on a phone is a grey smear rather than a chart. Each bar carries a
     * week of calories, and the target it is measured against is multiplied by the days in
     * that week, so "within goal" keeps meaning the same thing it means for a single day. The
     * last bar is a short week whenever today is not a Sunday, and it is measured against its
     * own length for the same reason.
     */
    private List<CalorieDay> buildCalorieWeeks(
            LocalDate from, LocalDate today, Integer targetKcal, Map<LocalDate, DailyNutritionTotals> totalsByDate) {
        List<CalorieDay> weeks = new ArrayList<>();
        for (LocalDate start = from; !start.isAfter(today); start = start.plusWeeks(1)) {
            LocalDate end = start.plusDays(6).isAfter(today) ? today : start.plusDays(6);
            int kcal = 0;
            int days = 0;
            for (LocalDate date = start; !date.isAfter(end); date = date.plusDays(1)) {
                DailyNutritionTotals totals = totalsByDate.get(date);
                kcal += totals != null ? totals.kcal() : 0;
                days++;
            }
            boolean withinGoal = targetKcal == null || kcal <= (long) targetKcal * days;
            weeks.add(new CalorieDay(start, kcal, withinGoal));
        }
        return weeks;
    }

    /**
     * The caller's zone. Falls back rather than throwing: the id is an authenticated caller's,
     * so a miss means the account closed mid-request, and the weigh-in's own write reports that
     * more honestly than a 404 about the date would.
     */
    private ZoneId zoneOf(UUID userId) {
        return userRepository.findById(userId).map(User::zone).orElse(UserTimeZones.FALLBACK);
    }
}
