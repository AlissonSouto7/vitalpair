package com.aps.vitalpair.gamification.infrastructure.web;

import java.time.LocalDate;

import com.aps.vitalpair.gamification.domain.model.StreakState;
import com.aps.vitalpair.gamification.domain.model.StreakType;
import com.aps.vitalpair.gamification.domain.model.UserStreak;

/**
 * A streak, plus what it means today.
 *
 * <p>{@code recordedToday} and {@code breaksToday} are derived here rather than in the
 * browser for two reasons: the rule that continues a streak lives in the service, and "today"
 * depends on the user's stored time zone, which the device does not reliably agree with. See
 * {@link StreakState}.
 */
public record StreakResponse(
        StreakType type,
        int currentCount,
        int longestCount,
        LocalDate lastActivityDate,
        boolean recordedToday,
        boolean breaksToday) {

    public static StreakResponse from(UserStreak streak, LocalDate today) {
        StreakState state = StreakState.of(streak, today);
        return new StreakResponse(
                streak.getType(),
                streak.getCurrentCount(),
                streak.getLongestCount(),
                streak.getLastActivityDate(),
                state.recordedToday(),
                state.breaksToday());
    }
}
