package com.aps.vitapair.activity.application.dto;

import com.aps.vitapair.activity.domain.model.ActivitySource;
import com.aps.vitapair.activity.domain.model.ActivityType;
import java.math.BigDecimal;
import java.time.Instant;

/**
 * Dados para registrar uma atividade. Se {@code caloriesBurned} for nulo e houver {@code steps},
 * as calorias são estimadas (passos x 0.04). {@code loggedAt} nulo usa o instante atual.
 */
public record LogActivityCommand(
        ActivityType activityType,
        Integer steps,
        BigDecimal distanceKm,
        BigDecimal caloriesBurned,
        Integer durationMinutes,
        ActivitySource source,
        String externalId,
        Instant loggedAt) {
}
