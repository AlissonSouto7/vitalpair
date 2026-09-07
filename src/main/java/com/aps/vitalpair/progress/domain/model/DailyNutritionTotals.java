package com.aps.vitalpair.progress.domain.model;

import java.time.LocalDate;

/**
 * Daily totals aggregated from food_logs, one per day with records: the calories and macros
 * consumed that day. Used to build the calorie chart and the macro averages.
 *
 * @param date     the day
 * @param kcal     total calories consumed that day
 * @param proteinG total protein (g) that day
 * @param carbG    total carbohydrate (g) that day
 * @param fatG     total fat (g) that day
 */
public record DailyNutritionTotals(LocalDate date, int kcal, int proteinG, int carbG, int fatG) {}
