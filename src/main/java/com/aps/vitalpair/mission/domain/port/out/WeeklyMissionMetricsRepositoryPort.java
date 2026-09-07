package com.aps.vitalpair.mission.domain.port.out;

import java.time.Instant;
import java.util.UUID;

/**
 * Outbound port for the read-only counts that feed weekly mission progress. Reads the log
 * tables directly, always filtered by user and period, which keeps the mission feature
 * self-contained.
 */
public interface WeeklyMissionMetricsRepositoryPort {

    /**
     * The number of distinct days on which the user logged at least one meal within
     * {@code [start, end)}.
     */
    int countMealDays(UUID userId, Instant start, Instant end);

    /**
     * The number of the user's activities within {@code [start, end)} whose type is not STEPS.
     */
    int countWorkouts(UUID userId, Instant start, Instant end);
}
