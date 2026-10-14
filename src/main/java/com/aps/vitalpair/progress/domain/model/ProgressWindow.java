package com.aps.vitalpair.progress.domain.model;

import java.util.Arrays;

/**
 * How far back the progress screen looks.
 *
 * <p>The screen was fixed at seven days, which answers "how was my week" and nothing else:
 * somebody six weeks into a change had no way to see the change. Three windows cover the
 * questions people actually ask, and the shortest stays the default so the screen opens on
 * the same thing it always did.
 *
 * <p>Ninety days of daily bars is ninety bars on a phone, which is a grey smear rather than a
 * chart, so the longest window groups the calorie bars by week. That is a presentation
 * decision made here rather than in the browser because the server is what sums the days: a
 * client aggregating 90 points would be 90 points sent to draw 13.
 */
public enum ProgressWindow {
    /** The default, and what the screen has always shown. */
    WEEK(7, false),

    MONTH(30, false),

    /** Grouped by week: 13 bars instead of 90. */
    QUARTER(90, true);

    private final int days;
    private final boolean groupedByWeek;

    ProgressWindow(int days, boolean groupedByWeek) {
        this.days = days;
        this.groupedByWeek = groupedByWeek;
    }

    /** How many days the window covers, today included. */
    public int days() {
        return days;
    }

    /** Whether the calorie chart sums whole weeks rather than showing each day. */
    public boolean isGroupedByWeek() {
        return groupedByWeek;
    }

    /**
     * The window a request asked for, falling back to {@link #WEEK}.
     *
     * <p>Lenient on purpose: this picks a chart, and an unknown value is a client that is
     * newer or older than this server, not an attack. Refusing with a 400 would blank a
     * screen over a query string.
     */
    public static ProgressWindow fromDays(Integer days) {
        if (days == null) {
            return WEEK;
        }
        return Arrays.stream(values()).filter(w -> w.days == days).findFirst().orElse(WEEK);
    }
}
