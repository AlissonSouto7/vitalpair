package com.aps.vitalpair.progress.domain.model;

/**
 * Média diária de um macronutriente nos últimos 7 dias, contra a meta.
 *
 * @param key     identificador do macro (PROTEIN, CARB, FAT)
 * @param label   rótulo em PT (Proteína, Carboidrato, Gordura)
 * @param avgG    média diária em gramas (soma no período / 7, arredondada)
 * @param targetG meta diária do macro em gramas, ou {@code null} se sem meta
 */
public record MacroAverage(String key, String label, int avgG, Integer targetG) {
}
