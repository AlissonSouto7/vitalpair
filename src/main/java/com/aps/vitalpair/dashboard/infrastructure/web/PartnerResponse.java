package com.aps.vitalpair.dashboard.infrastructure.web;

import java.util.UUID;

import com.aps.vitalpair.dashboard.application.dto.PartnerSummary;

public record PartnerResponse(
        UUID userId,
        String name,
        String avatarUrl,
        Integer calorieTarget,
        int consumedCalories,
        int burnedCalories,
        int netCalories) {

    public static PartnerResponse from(PartnerSummary p) {
        if (p == null) {
            return null;
        }
        return new PartnerResponse(
                p.userId(),
                p.name(),
                p.avatarUrl(),
                p.calorieTarget(),
                p.consumedCalories(),
                p.burnedCalories(),
                p.netCalories());
    }
}
