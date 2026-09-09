package com.aps.vitalpair.shared.time;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;

/**
 * One calendar day in one user's zone, as the instant range a query can use.
 *
 * <p>Half-open on purpose: {@code start} is included and {@code end} is not. A closed range
 * would need an end of 23:59:59.999999999, which either loses the last fraction of a second or
 * double-counts it against the next day, depending on the column's precision.
 */
public record DayWindow(LocalDate date, Instant start, Instant end) {

    /**
     * The window covering {@code date} in {@code zone}.
     *
     * <p>{@code atStartOfDay(zone)} rather than {@code atStartOfDay().atZone(zone)}: on the day
     * daylight saving begins, midnight may not exist, and only the former shifts to the first
     * instant that does. The end is derived from the next day's start for the same reason, so a
     * 23-hour or 25-hour day is still exactly one day.
     */
    public static DayWindow of(LocalDate date, ZoneId zone) {
        return new DayWindow(
                date,
                date.atStartOfDay(zone).toInstant(),
                date.plusDays(1).atStartOfDay(zone).toInstant());
    }
}
