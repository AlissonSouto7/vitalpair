package com.aps.vitalpair.activity.infrastructure.web;

import java.math.BigDecimal;
import java.time.Instant;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import com.aps.vitalpair.activity.domain.model.ActivitySource;
import com.aps.vitalpair.activity.domain.model.ActivityType;

public record LogActivityRequest(
        @NotNull ActivityType activityType,
        @PositiveOrZero Integer steps,
        @PositiveOrZero BigDecimal distanceKm,
        @PositiveOrZero BigDecimal caloriesBurned,
        @PositiveOrZero Integer durationMinutes,
        @NotNull ActivitySource source,
        @Size(max = 255) String externalId,
        Instant loggedAt) {}
