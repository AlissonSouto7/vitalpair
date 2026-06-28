package com.aps.vitalpair.gamification.infrastructure.web;

import com.aps.vitalpair.gamification.domain.model.Badge;
import com.aps.vitalpair.gamification.domain.model.BadgeCategory;

public record BadgeResponse(
        String code,
        String name,
        String description,
        String icon,
        BadgeCategory category) {

    public static BadgeResponse from(Badge badge) {
        return new BadgeResponse(
                badge.getCode(), badge.getName(), badge.getDescription(), badge.getIcon(), badge.getCategory());
    }
}
