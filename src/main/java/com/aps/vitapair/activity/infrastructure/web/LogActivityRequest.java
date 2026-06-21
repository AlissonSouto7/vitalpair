package com.aps.vitapair.activity.infrastructure.web;

import com.aps.vitapair.activity.domain.model.ActivitySource;
import com.aps.vitapair.activity.domain.model.ActivityType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.Instant;

public record LogActivityRequest(
        @NotNull ActivityType activityType,
        @PositiveOrZero Integer steps,
        @PositiveOrZero BigDecimal distanceKm,
        @PositiveOrZero BigDecimal caloriesBurned,
        @PositiveOrZero Integer durationMinutes,
        @NotNull ActivitySource source,
        @Size(max = 255) String externalId,
        Instant loggedAt) {
}
