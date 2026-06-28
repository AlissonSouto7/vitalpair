package com.aps.vitalpair.dashboard.infrastructure.web;

import com.aps.vitalpair.dashboard.application.dto.DayProgress;

public record DayProgressResponse(
        Integer calorieTarget,
        int consumedCalories,
        int burnedCalories,
        int netCalories,
        Integer remainingCalories,
        int consumedProteinG,
        int consumedCarbG,
        int consumedFatG,
        Integer proteinTargetG,
        Integer carbTargetG,
        Integer fatTargetG,
        int steps,
        int mealCount) {

    public static DayProgressResponse from(DayProgress p) {
        return new DayProgressResponse(
                p.calorieTarget(), p.consumedCalories(), p.burnedCalories(), p.netCalories(), p.remainingCalories(),
                p.consumedProteinG(), p.consumedCarbG(), p.consumedFatG(),
                p.proteinTargetG(), p.carbTargetG(), p.fatTargetG(), p.steps(), p.mealCount());
    }
}
