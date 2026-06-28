package com.aps.vitalpair.dashboard.application.dto;

import java.util.UUID;

/** Mini-resumo do parceiro para o dashboard (nulo enquanto o par estiver pendente). */
public record PartnerSummary(
        UUID userId,
        String name,
        String avatarUrl,
        Integer calorieTarget,
        int consumedCalories,
        int burnedCalories,
        int netCalories) {
}
