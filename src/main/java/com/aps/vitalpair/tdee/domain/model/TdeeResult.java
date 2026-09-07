package com.aps.vitalpair.tdee.domain.model;

/**
 * The result of the energy calculation.
 *
 * @param bmr                basal metabolic rate (kcal)
 * @param tdee               total daily energy expenditure at maintenance (kcal)
 * @param dailyCalorieTarget the daily calorie target after the goal adjustment (kcal)
 * @param proteinTargetG     the protein target (g)
 * @param carbTargetG        the carbohydrate target (g)
 * @param fatTargetG         the fat target (g)
 */
public record TdeeResult(
        int bmr, int tdee, int dailyCalorieTarget, int proteinTargetG, int carbTargetG, int fatTargetG) {}
