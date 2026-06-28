package com.aps.vitalpair.progress.domain.model;

import java.time.LocalDate;

/**
 * Calorias consumidas num dia, dentro da janela dos últimos 7 dias.
 *
 * @param date       dia
 * @param label      inicial do dia da semana em PT (D, S, T, Q, Q, S, S)
 * @param kcal       total de calorias consumidas no dia (0 se sem registro)
 * @param withinGoal true se {@code kcal <= meta}; true também quando não há meta
 */
public record CalorieDay(LocalDate date, String label, int kcal, boolean withinGoal) {
}
