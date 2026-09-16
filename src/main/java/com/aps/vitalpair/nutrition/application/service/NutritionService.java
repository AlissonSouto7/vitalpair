package com.aps.vitalpair.nutrition.application.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.aps.vitalpair.nutrition.application.dto.DailySummary;
import com.aps.vitalpair.nutrition.application.dto.LogMealCommand;
import com.aps.vitalpair.nutrition.domain.model.FavoriteFood;
import com.aps.vitalpair.nutrition.domain.model.FoodLog;
import com.aps.vitalpair.nutrition.domain.model.FoodProduct;
import com.aps.vitalpair.nutrition.domain.model.FoodSource;
import com.aps.vitalpair.nutrition.domain.port.in.DeleteFoodLogUseCase;
import com.aps.vitalpair.nutrition.domain.port.in.FindFoodByBarcodeUseCase;
import com.aps.vitalpair.nutrition.domain.port.in.GetDailyLogsUseCase;
import com.aps.vitalpair.nutrition.domain.port.in.GetDailySummaryUseCase;
import com.aps.vitalpair.nutrition.domain.port.in.GetFavoriteFoodsUseCase;
import com.aps.vitalpair.nutrition.domain.port.in.LogMealUseCase;
import com.aps.vitalpair.nutrition.domain.port.in.SearchFoodUseCase;
import com.aps.vitalpair.nutrition.domain.port.out.FoodLogRepositoryPort;
import com.aps.vitalpair.nutrition.domain.port.out.OpenFoodFactsPort;
import com.aps.vitalpair.shared.event.MealDeletedEvent;
import com.aps.vitalpair.shared.event.MealLoggedEvent;
import com.aps.vitalpair.shared.exception.BusinessRuleException;
import com.aps.vitalpair.shared.exception.ResourceNotFoundException;
import com.aps.vitalpair.shared.time.DayWindow;
import com.aps.vitalpair.user.domain.model.User;
import com.aps.vitalpair.user.domain.port.out.UserRepositoryPort;

@Service
public class NutritionService
        implements SearchFoodUseCase,
                FindFoodByBarcodeUseCase,
                LogMealUseCase,
                DeleteFoodLogUseCase,
                GetDailyLogsUseCase,
                GetDailySummaryUseCase,
                GetFavoriteFoodsUseCase {

    private static final int FAVORITES_LIMIT = 8;

    private final FoodLogRepositoryPort foodLogRepository;
    private final OpenFoodFactsPort openFoodFacts;
    private final UserRepositoryPort userRepository;
    private final ApplicationEventPublisher eventPublisher;

    public NutritionService(
            FoodLogRepositoryPort foodLogRepository,
            OpenFoodFactsPort openFoodFacts,
            UserRepositoryPort userRepository,
            ApplicationEventPublisher eventPublisher) {
        this.foodLogRepository = foodLogRepository;
        this.openFoodFacts = openFoodFacts;
        this.userRepository = userRepository;
        this.eventPublisher = eventPublisher;
    }

    @Override
    public List<FoodProduct> search(String query) {
        return openFoodFacts.searchByName(query);
    }

    @Override
    public FoodProduct findByBarcode(String barcode) {
        return openFoodFacts
                .findByBarcode(barcode)
                .orElseThrow(() -> new ResourceNotFoundException("Produto não encontrado para o código " + barcode));
    }

    @Override
    @Transactional
    public FoodLog logMeal(UUID userId, LogMealCommand command) {
        User user = requireUser(userId);
        rejectMealWithoutNutritionData(command);
        FoodLog log = FoodLog.builder()
                .tenantId(user.getTenantId())
                .userId(userId)
                .foodName(command.foodName())
                .barcode(command.barcode())
                .quantityG(command.quantityG())
                .caloriesKcal(command.caloriesKcal())
                .proteinG(orZero(command.proteinG()))
                .carbG(orZero(command.carbG()))
                .fatG(orZero(command.fatG()))
                .mealType(command.mealType())
                .source(command.source())
                .isPrivate(command.isPrivate())
                .loggedAt(command.loggedAt() != null ? command.loggedAt() : Instant.now())
                .build();
        FoodLog saved = foodLogRepository.save(log);
        eventPublisher.publishEvent(new MealLoggedEvent(
                userId,
                saved.getTenantId(),
                saved.getId(),
                // The user's day, not UTC's: this date is what the streak, the missions and the
                // weekly scoreboard are keyed on, so a meal logged at 21:00 in Brazil counted
                // towards tomorrow and could break a streak the person had not broken.
                saved.getLoggedAt().atZone(user.zone()).toLocalDate(),
                saved.getFoodName(),
                saved.getMealType().name(),
                saved.isPrivate(),
                round(saved.getCaloriesKcal()),
                round(saved.getProteinG()),
                round(saved.getCarbG()),
                round(saved.getFatG())));
        return saved;
    }

    @Override
    @Transactional
    public void delete(UUID userId, UUID foodLogId) {
        FoodLog log = foodLogRepository
                .findById(foodLogId)
                .orElseThrow(() -> ResourceNotFoundException.of("Registro", foodLogId));
        if (!log.getUserId().equals(userId)) {
            throw ResourceNotFoundException.of("Registro", foodLogId);
        }
        foodLogRepository.deleteById(foodLogId);
        // The pair's feed keeps its own copy of the meal, so removing the diary row is only half
        // the deletion: without this the partner went on reading a meal that no longer existed.
        eventPublisher.publishEvent(new MealDeletedEvent(userId, log.getTenantId(), foodLogId));
    }

    @Override
    @Transactional(readOnly = true)
    public List<FoodLog> getLogs(UUID userId, LocalDate date) {
        User user = requireUser(userId);
        return foodLogRepository.findByUserAndDay(userId, dayOf(user, date));
    }

    @Override
    @Transactional(readOnly = true)
    public DailySummary getSummary(UUID userId, LocalDate date) {
        User user = requireUser(userId);
        List<FoodLog> logs = foodLogRepository.findByUserAndDay(userId, dayOf(user, date));

        int calories = sum(logs, FoodLog::getCaloriesKcal);
        int protein = sum(logs, FoodLog::getProteinG);
        int carb = sum(logs, FoodLog::getCarbG);
        int fat = sum(logs, FoodLog::getFatG);

        Integer target = user.getDailyCalorieTarget();
        Integer remaining = target != null ? target - calories : null;

        return new DailySummary(
                date,
                calories,
                protein,
                carb,
                fat,
                target,
                user.getProteinTargetG(),
                user.getCarbTargetG(),
                user.getFatTargetG(),
                remaining,
                logs.size());
    }

    @Override
    @Transactional(readOnly = true)
    public List<FavoriteFood> getFavorites(UUID userId) {
        return foodLogRepository.findTopByUser(userId, FAVORITES_LIMIT);
    }

    private User requireUser(UUID userId) {
        return userRepository.findById(userId).orElseThrow(() -> ResourceNotFoundException.of("Usuário", userId));
    }

    /**
     * Refuses a meal taken from the food database that carries no nutrition at all.
     *
     * <p>Open Food Facts returns entries with no nutrition information, and the search screen
     * used to turn that absence into zeros: picking one opened the editor at 0 kcal and saving it
     * recorded a meal asserting the food has no calories. "Unknown" and "zero" are different
     * claims, and only the person knows which is true.
     *
     * <p>Deliberately narrow. A hand-entered 0 kcal meal is allowed, because black coffee, water
     * and diet soda really are zero, and refusing those would make the diary wrong in the other
     * direction. What is refused is an imported entry where every macro is zero too, which is the
     * shape "no data" takes and not the shape any real food takes.
     *
     * <p>The screen guards this as well, and has to: a person should learn about it before typing
     * a portion size, not after pressing save. This is here because the screen is not the only
     * caller, and a rule that lives only in the browser is not a rule.
     */
    private static void rejectMealWithoutNutritionData(LogMealCommand command) {
        if (command.source() != FoodSource.OPEN_FOOD_FACTS) {
            return;
        }
        boolean nothingAtAll = isZero(command.caloriesKcal())
                && isZero(command.proteinG())
                && isZero(command.carbG())
                && isZero(command.fatG());
        if (nothingAtAll) {
            throw new BusinessRuleException(
                    "Esse alimento não tem informação nutricional. Preenche as calorias pra registrar.");
        }
    }

    private static boolean isZero(BigDecimal value) {
        return value == null || value.signum() == 0;
    }
    /**
     * The day's boundaries in the user's own zone, not the server's.
     *
     * <p>Reading the zone off the user already loaded rather than asking {@code UserDayUseCase}
     * again: both callers need the user anyway, and a second lookup would be a second query per
     * request for an answer already in hand.
     */
    private static DayWindow dayOf(User user, LocalDate date) {
        return DayWindow.of(date, user.zone());
    }

    private static BigDecimal orZero(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }

    private static int round(BigDecimal value) {
        return value != null ? value.setScale(0, RoundingMode.HALF_UP).intValue() : 0;
    }

    private static int sum(List<FoodLog> logs, java.util.function.Function<FoodLog, BigDecimal> field) {
        return logs.stream()
                .map(field)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(0, RoundingMode.HALF_UP)
                .intValue();
    }
}
