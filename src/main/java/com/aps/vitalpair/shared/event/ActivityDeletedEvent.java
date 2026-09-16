package com.aps.vitalpair.shared.event;

import java.util.UUID;

/**
 * Published when an activity log is deleted, so the copies of it elsewhere can go too.
 *
 * <p>Mirrors {@link MealDeletedEvent}. The pair's feed keeps its own row per logged activity, and
 * removing the record alone would leave the partner reading a workout that no longer exists.
 *
 * @param activityLogId the deleted record, matched against the id the log event carried
 */
public record ActivityDeletedEvent(UUID userId, UUID tenantId, UUID activityLogId) {}
