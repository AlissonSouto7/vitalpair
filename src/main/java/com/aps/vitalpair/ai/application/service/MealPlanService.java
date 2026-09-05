package com.aps.vitalpair.ai.application.service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.aps.vitalpair.ai.application.dto.MealPlanView;
import com.aps.vitalpair.ai.application.dto.SwapMealCommand;
import com.aps.vitalpair.ai.domain.model.MealPlan;
import com.aps.vitalpair.ai.domain.model.MealPlanItem;
import com.aps.vitalpair.ai.domain.model.NutritionTargets;
import com.aps.vitalpair.ai.domain.port.in.GenerateMealPlanUseCase;
import com.aps.vitalpair.ai.domain.port.in.GetMealPlanUseCase;
import com.aps.vitalpair.ai.domain.port.in.SwapMealUseCase;
import com.aps.vitalpair.ai.domain.port.out.MealPlanGeneratorPort;
import com.aps.vitalpair.ai.domain.port.out.MealPlanRepositoryPort;
import com.aps.vitalpair.shared.exception.BusinessRuleException;
import com.aps.vitalpair.shared.exception.ResourceNotFoundException;
import com.aps.vitalpair.user.domain.model.User;
import com.aps.vitalpair.user.domain.port.out.UserRepositoryPort;

/**
 * Casos de uso do plano alimentar semanal por IA. A semana é sempre a que contém a data atual
 * (week start = segunda-feira, {@code previousOrSame(MONDAY)}). Gerar substitui o plano da semana.
 */
@Service
public class MealPlanService implements GetMealPlanUseCase, GenerateMealPlanUseCase, SwapMealUseCase {

    private final MealPlanRepositoryPort mealPlanRepository;
    private final MealPlanGeneratorPort generator;
    private final UserRepositoryPort userRepository;

    public MealPlanService(
            MealPlanRepositoryPort mealPlanRepository,
            MealPlanGeneratorPort generator,
            UserRepositoryPort userRepository) {
        this.mealPlanRepository = mealPlanRepository;
        this.generator = generator;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<MealPlanView> getCurrentWeekPlan(UUID userId) {
        return mealPlanRepository
                .findByUserAndWeek(userId, currentWeekStart())
                .map(plan -> new MealPlanView(plan, calorieTargetOf(userId)));
    }

    @Override
    @Transactional
    public MealPlanView generate(UUID userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> ResourceNotFoundException.of("Usuário", userId));
        if (user.getDailyCalorieTarget() == null) {
            throw new BusinessRuleException("Termina teu perfil primeiro que eu monto o cardápio na tua meta.");
        }

        NutritionTargets targets = new NutritionTargets(
                user.getDailyCalorieTarget(),
                user.getProteinTargetG(),
                user.getCarbTargetG(),
                user.getFatTargetG(),
                user.getGoal());
        List<MealPlanItem> items = generator.generateWeek(targets);

        MealPlan saved = mealPlanRepository.replace(new MealPlan(null, userId, currentWeekStart(), null, items));
        return new MealPlanView(saved, user.getDailyCalorieTarget());
    }

    @Override
    @Transactional
    public MealPlanView swap(UUID userId, SwapMealCommand command) {
        LocalDate weekStart = currentWeekStart();
        MealPlan plan = mealPlanRepository
                .findByUserAndWeek(userId, weekStart)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Plano alimentar da semana não encontrado. Gere o cardápio primeiro."));

        MealPlanItem current = plan.items().stream()
                .filter(item -> item.dayIndex() == command.dayIndex() && item.mealType() == command.mealType())
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Refeição não encontrada no plano da semana."));

        MealPlanItem alternative = generator.generateAlternative(current);
        mealPlanRepository.updateItem(
                current.id(),
                alternative.name(),
                alternative.kcal(),
                alternative.proteinG(),
                alternative.carbG(),
                alternative.fatG());

        MealPlan updated = mealPlanRepository
                .findByUserAndWeek(userId, weekStart)
                .orElseThrow(() -> new ResourceNotFoundException("Plano alimentar da semana não encontrado."));
        return new MealPlanView(updated, calorieTargetOf(userId));
    }

    private Integer calorieTargetOf(UUID userId) {
        return userRepository.findById(userId).map(User::getDailyCalorieTarget).orElse(null);
    }

    /** Segunda-feira da semana atual. */
    private static LocalDate currentWeekStart() {
        return LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
    }
}
