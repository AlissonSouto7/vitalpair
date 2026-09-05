package com.aps.vitalpair.gamification.infrastructure.web;

import java.time.Instant;

import com.aps.vitalpair.gamification.application.dto.EarnedBadge;

public record EarnedBadgeResponse(BadgeResponse badge, Instant earnedAt) {

    public static EarnedBadgeResponse from(EarnedBadge earned) {
        return new EarnedBadgeResponse(BadgeResponse.from(earned.badge()), earned.earnedAt());
    }
}
