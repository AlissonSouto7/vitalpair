package com.aps.vitalpair.shared.event;

import java.util.UUID;

/**
 * Published when a meal log is deleted, so the copies of it elsewhere can go too.
 *
 * <p>The pair's feed keeps its own row per logged meal. Without this event, deleting a meal
 * emptied the diary and left the feed item in place, so the partner went on reading a meal that
 * no longer existed, and the item kept showing the points badge next to it.
 *
 * <p>Carries only what a consumer needs to find its own copy. The meal's contents are gone by
 * the time this is delivered, and a consumer that wants them should have kept them.
 *
 * @param foodLogId the deleted record, matched against the id the log event carried
 */
public record MealDeletedEvent(UUID userId, UUID tenantId, UUID foodLogId) {}
