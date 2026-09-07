package com.aps.vitalpair.ai.infrastructure.web;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import com.aps.vitalpair.ai.application.dto.MealPlanView;
import com.aps.vitalpair.ai.domain.model.MealPlanItem;
import com.aps.vitalpair.ai.domain.model.PlanMealType;

/**
 * The weekly meal plan contract for the frontend: 7 ordered days (dayIndex 0 = Monday), each
 * day's meals in the order breakfast, lunch, snack, dinner.
 */
public record MealPlanResponse(LocalDate weekStart, Integer targetKcal, List<Day> days) {

    public record Day(int dayIndex, LocalDate date, List<Meal> meals) {}

    public record Meal(PlanMealType mealType, String name, int kcal, int proteinG, int carbG, int fatG) {}

    public static MealPlanResponse from(MealPlanView view) {
        LocalDate weekStart = view.plan().weekStart();
        Map<Integer, List<MealPlanItem>> byDay =
                view.plan().items().stream().collect(Collectors.groupingBy(MealPlanItem::dayIndex));

        List<Day> days = new ArrayList<>(7);
        for (int dayIndex = 0; dayIndex <= 6; dayIndex++) {
            List<Meal> meals = byDay.getOrDefault(dayIndex, List.of()).stream()
                    .sorted(Comparator.comparingInt(item -> item.mealType().ordinal()))
                    .map(item -> new Meal(
                            item.mealType(), item.name(), item.kcal(), item.proteinG(), item.carbG(), item.fatG()))
                    .toList();
            days.add(new Day(dayIndex, weekStart.plusDays(dayIndex), meals));
        }
        return new MealPlanResponse(weekStart, view.targetKcal(), days);
    }
}
