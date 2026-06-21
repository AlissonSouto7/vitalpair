package com.aps.vitapair.gamification.infrastructure.web;

import com.aps.vitapair.gamification.application.dto.EarnedBadge;
import java.time.Instant;

public record EarnedBadgeResponse(BadgeResponse badge, Instant earnedAt) {

    public static EarnedBadgeResponse from(EarnedBadge earned) {
        return new EarnedBadgeResponse(BadgeResponse.from(earned.badge()), earned.earnedAt());
    }
}
