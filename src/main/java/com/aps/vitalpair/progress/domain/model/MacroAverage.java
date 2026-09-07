package com.aps.vitalpair.progress.domain.model;

/**
 * The daily average of one macronutrient over the last 7 days, against the target.
 *
 * @param key     the macro identifier (PROTEIN, CARB, FAT)
 * @param label   the label in Portuguese (Proteína, Carboidrato, Gordura)
 * @param avgG    the daily average in grams (the period's sum / 7, rounded)
 * @param targetG the macro's daily target in grams, or {@code null} without a target
 */
public record MacroAverage(String key, String label, int avgG, Integer targetG) {}
