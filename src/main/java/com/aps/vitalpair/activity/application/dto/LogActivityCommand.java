package com.aps.vitalpair.activity.application.dto;

import java.math.BigDecimal;
import java.time.Instant;

import com.aps.vitalpair.activity.domain.model.ActivitySource;
import com.aps.vitalpair.activity.domain.model.ActivityType;

/**
 * What it takes to log an activity. When {@code caloriesBurned} is null and {@code steps} is
 * present, calories are estimated as steps x 0.04. A null {@code loggedAt} means now.
 */
public record LogActivityCommand(
        ActivityType activityType,
        Integer steps,
        BigDecimal distanceKm,
        BigDecimal caloriesBurned,
        Integer durationMinutes,
        ActivitySource source,
        String externalId,
        Instant loggedAt) {}
