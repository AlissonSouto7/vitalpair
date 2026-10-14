package com.aps.vitalpair.gamification.domain.model;

import java.time.LocalDate;

/**
 * A streak read against a particular day: whether it already counts today, and whether today
 * is the day it ends.
 *
 * <p>This exists so the browser never has to work it out. The question "is my streak about to
 * break?" needs two things the client does not reliably have: the rule, which lives in {@link
 * com.aps.vitalpair.gamification.application.service.StreakService} and continues a streak
 * only when the new record lands exactly one day after the last, and the user's own date,
 * which comes from their stored time zone rather than from the device. A phone left in another
 * zone would show the warning on the wrong day, and an urgent warning on the wrong day is
 * worse than none: the person either panics for nothing or trusts it and loses the streak.
 *
 * @param recordedToday the streak already counts today, so nothing is at risk
 * @param breaksToday the last record was yesterday and none has arrived today, so the streak
 *     resets to 1 unless the person logs something before their day ends
 */
public record StreakState(boolean recordedToday, boolean breaksToday) {

    public static StreakState of(UserStreak streak, LocalDate today) {
        LocalDate last = streak.getLastActivityDate();
        if (last == null) {
            return new StreakState(false, false);
        }

        boolean recordedToday = last.isEqual(today);
        // A streak already at zero, or one whose last record is older than yesterday, has
        // nothing left to lose: it is already broken and the next record starts it at 1.
        boolean breaksToday = streak.getCurrentCount() > 0 && last.isEqual(today.minusDays(1));

        return new StreakState(recordedToday, breaksToday);
    }
}
