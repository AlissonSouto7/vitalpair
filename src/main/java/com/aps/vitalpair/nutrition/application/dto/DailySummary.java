package com.aps.vitalpair.nutrition.application.dto;

import java.time.LocalDate;

/** Resumo nutricional do dia: consumido vs meta. */
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
