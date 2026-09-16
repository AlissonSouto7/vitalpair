package com.aps.vitalpair.shared.event;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Published when a physical activity is logged. Consumed by gamification, the feed and notifications.
 *
 * @param activityLogId the record this event came from, so a consumer that keeps a copy can find
 *     it again when the activity is deleted. See {@link ActivityDeletedEvent}.
 */
public record ActivityLoggedEvent(
        UUID userId,
        UUID tenantId,
        UUID activityLogId,
        LocalDate date,
        String activityType,
        int caloriesBurned,
        Integer durationMinutes) {}
