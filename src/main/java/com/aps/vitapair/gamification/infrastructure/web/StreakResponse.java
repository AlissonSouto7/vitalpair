package com.aps.vitapair.gamification.infrastructure.web;

import com.aps.vitapair.gamification.domain.model.StreakType;
import com.aps.vitapair.gamification.domain.model.UserStreak;
import java.time.LocalDate;

public record StreakResponse(
        StreakType type,
        int currentCount,
        int longestCount,
        LocalDate lastActivityDate) {

    public static StreakResponse from(UserStreak streak) {
        return new StreakResponse(
                streak.getType(), streak.getCurrentCount(), streak.getLongestCount(), streak.getLastActivityDate());
    }
}
