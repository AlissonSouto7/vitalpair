package com.aps.vitalpair.dashboard.domain.model;

/**
 * A user's day: consumed (nutrition) against burned (activity) against the target.
 *
 * @param netCalories       consumed - burned
 * @param remainingCalories target - net (positive means room to eat; negative means over)
 */
public record DayProgress(
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
        int mealCount) {}
