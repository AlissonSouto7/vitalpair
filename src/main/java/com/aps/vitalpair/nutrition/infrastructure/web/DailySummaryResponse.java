package com.aps.vitalpair.nutrition.infrastructure.web;

import java.time.LocalDate;

import com.aps.vitalpair.nutrition.application.dto.DailySummary;

public record DailySummaryResponse(
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
        int mealCount) {

    public static DailySummaryResponse from(DailySummary s) {
        return new DailySummaryResponse(
                s.date(),
                s.consumedCalories(),
                s.consumedProteinG(),
                s.consumedCarbG(),
                s.consumedFatG(),
                s.targetCalories(),
                s.targetProteinG(),
                s.targetCarbG(),
                s.targetFatG(),
                s.remainingCalories(),
                s.mealCount());
    }
}
