package com.aps.vitalpair.activity.domain.port.in;

import java.util.UUID;

/**
 * Removes one of the caller's own activity records.
 *
 * <p>A meal could be deleted and an activity could not, so a workout logged by mistake, or with
 * the wrong number, stayed in the diary and in the pair's timeline for good.
 */
public interface DeleteActivityLogUseCase {

    void delete(UUID userId, UUID activityLogId);
}
