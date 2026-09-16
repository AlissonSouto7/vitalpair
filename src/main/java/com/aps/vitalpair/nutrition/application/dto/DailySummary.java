package com.aps.vitalpair.nutrition.application.dto;

import java.time.LocalDate;

/**
 * The day's nutrition: what was eaten against the target.
 *
 * <p>{@code remainingCalories} here is target minus consumed, and deliberately ignores exercise.
 * The dashboard's {@code DayProgress} subtracts what was burned as well, so the two numbers
 * differ for the same day, by however much the person trained.
 *
 * <p>Both are defensible, and they answer different questions: this one is "how far from the
 * target am I", the dashboard's is "how much can I still eat". They were a defect only because
 * both screens printed them under the same words, next to identical calorie rings, so the
 * number appeared to change by 730 kcal for no reason when the person moved between them. The
 * labels now name which is which, rather than one definition being forced on both.
 */
public record DailySummary(
        LocalDate date,
        int consumedCalories,
        int consumedProteinG,
        int consumedCarbG,
        int consumedFatG,
        Integer targetCalories,
        Integer targetProteinG,
        Integer targetCarbG,
        Integer targetFatG,
        Integer remainingCalories,
        int mealCount) {}
