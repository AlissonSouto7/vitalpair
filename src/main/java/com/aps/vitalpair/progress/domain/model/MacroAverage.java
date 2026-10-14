package com.aps.vitalpair.progress.domain.model;

/**
 * The daily average of one macronutrient over the window, against the target.
 *
 * <p>No label. It used to carry "Proteína", "Carboidrato" and "Gordura", written on the
 * server, which put Portuguese words under a chart in any of the other three languages. The
 * key is stable, so the screen translates from it, exactly as it already does with a badge
 * code.
 *
 * @param key the macro identifier (PROTEIN, CARB, FAT)
 * @param avgG the daily average in grams (the window's sum divided by all of its days)
 * @param targetG the macro's daily target in grams, or {@code null} without a target
 */
public record MacroAverage(String key, int avgG, Integer targetG) {}
