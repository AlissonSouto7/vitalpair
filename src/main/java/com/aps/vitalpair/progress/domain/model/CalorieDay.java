package com.aps.vitalpair.progress.domain.model;

import java.time.LocalDate;

/**
 * The calories consumed on one day within the last-7-days window.
 *
 * @param date       the day
 * @param label      the weekday's initial in Portuguese (D, S, T, Q, Q, S, S)
 * @param kcal       total calories consumed that day (0 when nothing was logged)
 * @param withinGoal true when {@code kcal <= target}; also true when there is no target
 */
public record CalorieDay(LocalDate date, String label, int kcal, boolean withinGoal) {}
