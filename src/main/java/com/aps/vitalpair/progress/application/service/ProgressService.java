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

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.aps.vitalpair.progress.domain.model.CalorieDay;
import com.aps.vitalpair.progress.domain.model.DailyNutritionTotals;
import com.aps.vitalpair.progress.domain.model.MacroAverage;
import com.aps.vitalpair.progress.domain.model.ProgressView;
import com.aps.vitalpair.progress.domain.model.WeightPoint;
import com.aps.vitalpair.progress.domain.port.in.GetProgressUseCase;
import com.aps.vitalpair.progress.domain.port.in.RecordWeightUseCase;
import com.aps.vitalpair.progress.domain.port.out.NutritionMetricsPort;
import com.aps.vitalpair.progress.domain.port.out.WeightLogRepositoryPort;
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

    /** How many weight history points to return, oldest to newest. */
    private static final int WEIGHT_HISTORY_LIMIT = 26;

    /** The window of the calorie chart and the macro averages: 7 days (today plus the 6 before). */
    private static final int WINDOW_DAYS = 7;

    /** Iniciais dos dias da semana em PT, indexadas por DayOfWeek (1=segunda ... 7=domingo). */
    private static final String[] WEEKDAY_INITIALS = {"S", "T", "Q", "Q", "S", "S", "D"};

    private final WeightLogRepositoryPort weightLogRepository;
    private final NutritionMetricsPort nutritionMetrics;
    private final UserRepositoryPort userRepository;

    public ProgressService(
            WeightLogRepositoryPort weightLogRepository,
            NutritionMetricsPort nutritionMetrics,
            UserRepositoryPort userRepository) {
        this.weightLogRepository = weightLogRepository;
        this.nutritionMetrics = nutritionMetrics;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public void recordTodayWeight(UUID userId, BigDecimal weightKg) {
        // Today where the person is. LocalDate.now() would file a weigh-in taken after 21:00
        // in Brazil under tomorrow, and overwrite tomorrow's real entry when it arrives.
        weightLogRepository.upsert(userId, LocalDate.now(zoneOf(userId)), weightKg);
    }

    @Override
    @Transactional(readOnly = true)
    public ProgressView getProgress(UUID userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> ResourceNotFoundException.of("Usuário", userId));

        LocalDate today = LocalDate.now(user.zone());
        LocalDate from = today.minusDays(WINDOW_DAYS - 1L);

        List<WeightPoint> weights = buildWeights(userId, user, today);
        Integer targetKcal = user.getDailyCalorieTarget();

        Map<LocalDate, DailyNutritionTotals> totalsByDate =
                nutritionMetrics.findDailyTotals(userId, from, today, user.zone()).stream()
                        .collect(Collectors.toMap(DailyNutritionTotals::date, Function.identity()));

        List<CalorieDay> calories = buildCalorieDays(from, today, targetKcal, totalsByDate);
        List<MacroAverage> macros = buildMacroAverages(totalsByDate.values(), user);

        return new ProgressView(weights, targetKcal, calories, macros);
    }

    private List<WeightPoint> buildWeights(UUID userId, User user, LocalDate today) {
        List<WeightPoint> weights = weightLogRepository.findRecentByUser(userId, WEIGHT_HISTORY_LIMIT);
        if (weights.isEmpty() && user.getWeightKg() != null) {
            return List.of(new WeightPoint(today, user.getWeightKg()));
        }
        return weights;
    }

    private List<CalorieDay> buildCalorieDays(
            LocalDate from, LocalDate today, Integer targetKcal, Map<LocalDate, DailyNutritionTotals> totalsByDate) {
        List<CalorieDay> days = new ArrayList<>(WINDOW_DAYS);
        for (LocalDate date = from; !date.isAfter(today); date = date.plusDays(1)) {
            DailyNutritionTotals totals = totalsByDate.get(date);
            int kcal = totals != null ? totals.kcal() : 0;
            boolean withinGoal = targetKcal == null || kcal <= targetKcal;
            days.add(new CalorieDay(date, initialOf(date), kcal, withinGoal));
        }
        return days;
    }

    private List<MacroAverage> buildMacroAverages(java.util.Collection<DailyNutritionTotals> totals, User user) {
        int protein = avg(totals, DailyNutritionTotals::proteinG);
        int carb = avg(totals, DailyNutritionTotals::carbG);
        int fat = avg(totals, DailyNutritionTotals::fatG);
        return List.of(
                new MacroAverage("PROTEIN", "Proteína", protein, user.getProteinTargetG()),
                new MacroAverage("CARB", "Carboidrato", carb, user.getCarbTargetG()),
                new MacroAverage("FAT", "Gordura", fat, user.getFatTargetG()));
    }

    /** The period average: the macro summed over the days with records, divided by {@link #WINDOW_DAYS}. */
    private static int avg(
            java.util.Collection<DailyNutritionTotals> totals,
            java.util.function.ToIntFunction<DailyNutritionTotals> field) {
        int sum = totals.stream().filter(Objects::nonNull).mapToInt(field).sum();
        return Math.round((float) sum / WINDOW_DAYS);
    }

    private static String initialOf(LocalDate date) {
        return WEEKDAY_INITIALS[date.getDayOfWeek().getValue() - 1];
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
