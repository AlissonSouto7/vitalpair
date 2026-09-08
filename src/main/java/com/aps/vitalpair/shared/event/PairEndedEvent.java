package com.aps.vitalpair.shared.event;

import java.util.UUID;

/**
 * Published when a pair ends, carrying the tenant it happened in and both people.
 *
 * <p>By the time a listener sees this, neither user belongs to {@code tenantId} any more:
 * each is in a pending tenant of their own. The id is here so a listener can reach what the
 * pair left behind, not to scope a write to it.
 *
 * @param leaverId who asked to end it
 * @param partnerId the other one, who has yet to find out
 */
public record PairEndedEvent(UUID tenantId, UUID leaverId, UUID partnerId) {}
