package com.aps.vitalpair.progress.domain.model;

import java.util.List;

/**
 * The whole Progress screen: weight history, the last 7 days of calories and the last 7 days'
 * macro averages.
 *
 * @param weights    weight points in chronological order (oldest to today)
 * @param targetKcal the user's calorie target, or {@code null} without a target
 * @param calories   one item per day over the last 7 days (6 days ago to today)
 * @param macros     daily averages of protein, carbohydrate and fat
 */
public record ProgressView(
        List<WeightPoint> weights, Integer targetKcal, List<CalorieDay> calories, List<MacroAverage> macros) {}
