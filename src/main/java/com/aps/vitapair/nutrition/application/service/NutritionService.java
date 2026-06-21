package com.aps.vitapair.nutrition.application.service;

import com.aps.vitapair.nutrition.application.dto.DailySummary;
import com.aps.vitapair.nutrition.application.dto.LogMealCommand;
import com.aps.vitapair.nutrition.domain.model.FoodLog;
import com.aps.vitapair.nutrition.domain.model.FoodProduct;
import com.aps.vitapair.nutrition.domain.port.in.DeleteFoodLogUseCase;
import com.aps.vitapair.nutrition.domain.port.in.FindFoodByBarcodeUseCase;
import com.aps.vitapair.nutrition.domain.port.in.GetDailyLogsUseCase;
import com.aps.vitapair.nutrition.domain.port.in.GetDailySummaryUseCase;
import com.aps.vitapair.nutrition.domain.port.in.LogMealUseCase;
import com.aps.vitapair.nutrition.domain.port.in.SearchFoodUseCase;
import com.aps.vitapair.nutrition.domain.port.out.FoodLogRepositoryPort;
import com.aps.vitapair.nutrition.domain.port.out.OpenFoodFactsPort;
import com.aps.vitapair.shared.exception.ResourceNotFoundException;
import com.aps.vitapair.user.domain.model.User;
import com.aps.vitapair.user.domain.port.out.UserRepositoryPort;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NutritionService implements
        SearchFoodUseCase, FindFoodByBarcodeUseCase, LogMealUseCase,
        DeleteFoodLogUseCase, GetDailyLogsUseCase, GetDailySummaryUseCase {

    private final FoodLogRepositoryPort foodLogRepository;
    private final OpenFoodFactsPort openFoodFacts;
    private final UserRepositoryPort userRepository;

    public NutritionService(
            FoodLogRepositoryPort foodLogRepository,
            OpenFoodFactsPort openFoodFacts,
            UserRepositoryPort userRepository) {
        this.foodLogRepository = foodLogRepository;
        this.openFoodFacts = openFoodFacts;
        this.userRepository = userRepository;
    }

    @Override
    public List<FoodProduct> search(String query) {
        return openFoodFacts.searchByName(query);
    }

    @Override
    public FoodProduct findByBarcode(String barcode) {
        return openFoodFacts.findByBarcode(barcode)
                .orElseThrow(() -> new ResourceNotFoundException("Produto não encontrado para o código " + barcode));
    }

    @Override
    @Transactional
    public FoodLog logMeal(UUID userId, LogMealCommand command) {
        User user = requireUser(userId);
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
                .loggedAt(command.loggedAt() != null ? command.loggedAt() : Instant.now())
                .build();
        return foodLogRepository.save(log);
    }

    @Override
    @Transactional
    public void delete(UUID userId, UUID foodLogId) {
        FoodLog log = foodLogRepository.findById(foodLogId)
                .orElseThrow(() -> ResourceNotFoundException.of("Registro", foodLogId));
        if (!log.getUserId().equals(userId)) {
            throw ResourceNotFoundException.of("Registro", foodLogId);
        }
        foodLogRepository.deleteById(foodLogId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<FoodLog> getLogs(UUID userId, LocalDate date) {
        return foodLogRepository.findByUserAndDate(userId, date);
    }

    @Override
    @Transactional(readOnly = true)
    public DailySummary getSummary(UUID userId, LocalDate date) {
        User user = requireUser(userId);
        List<FoodLog> logs = foodLogRepository.findByUserAndDate(userId, date);

        int calories = sum(logs, FoodLog::getCaloriesKcal);
        int protein = sum(logs, FoodLog::getProteinG);
        int carb = sum(logs, FoodLog::getCarbG);
        int fat = sum(logs, FoodLog::getFatG);

        Integer target = user.getDailyCalorieTarget();
        Integer remaining = target != null ? target - calories : null;

        return new DailySummary(
                date, calories, protein, carb, fat,
                target, user.getProteinTargetG(), user.getCarbTargetG(), user.getFatTargetG(),
                remaining, logs.size());
    }

    private User requireUser(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> ResourceNotFoundException.of("Usuário", userId));
    }

    private static BigDecimal orZero(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
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
