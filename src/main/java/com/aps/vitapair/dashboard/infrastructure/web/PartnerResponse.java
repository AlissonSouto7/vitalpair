package com.aps.vitapair.dashboard.infrastructure.web;

import com.aps.vitapair.dashboard.application.dto.PartnerSummary;
import java.util.UUID;

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
                p.userId(), p.name(), p.avatarUrl(), p.calorieTarget(),
                p.consumedCalories(), p.burnedCalories(), p.netCalories());
    }
}
