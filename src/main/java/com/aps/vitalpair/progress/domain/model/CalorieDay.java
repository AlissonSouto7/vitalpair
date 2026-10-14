package com.aps.vitalpair.progress.domain.model;

import java.time.LocalDate;

/**
 * The calories consumed in one bar of the chart: a day, or a week in the ninety-day window.
 *
 * <p>No label. This used to carry the weekday's initial, built on the server from a
 * Portuguese array, which wrote "S T Q Q S S D" under an English chart; worse, those
 * initials are ambiguous even in Portuguese, where S and Q each appear twice. The date is
 * the fact, and the screen writes the label from it in the reader's own language.
 *
 * @param date the day, or the first day of the week when the bars are grouped
 * @param kcal total calories consumed in that bar (0 when nothing was logged)
 * @param withinGoal true when the calories are within the target for the days covered; also
 *     true when there is no target
 */
public record CalorieDay(LocalDate date, int kcal, boolean withinGoal) {}
