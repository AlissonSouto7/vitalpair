package com.aps.vitapair.activity.infrastructure.web;

import com.aps.vitapair.activity.domain.model.ActivityLog;
import com.aps.vitapair.activity.domain.model.ActivitySource;
import com.aps.vitapair.activity.domain.model.ActivityType;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record ActivityLogResponse(
        UUID id,
        ActivityType activityType,
        Integer steps,
        BigDecimal distanceKm,
        BigDecimal caloriesBurned,
        Integer durationMinutes,
        ActivitySource source,
        String externalId,
        Instant loggedAt) {

    public static ActivityLogResponse from(ActivityLog log) {
        return new ActivityLogResponse(
                log.getId(),
                log.getActivityType(),
                log.getSteps(),
                log.getDistanceKm(),
                log.getCaloriesBurned(),
                log.getDurationMinutes(),
                log.getSource(),
                log.getExternalId(),
                log.getLoggedAt());
    }
}
