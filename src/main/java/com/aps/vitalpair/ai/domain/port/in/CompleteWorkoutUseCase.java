package com.aps.vitalpair.ai.domain.port.in;

import java.util.UUID;

import com.aps.vitalpair.ai.application.dto.WorkoutToday;

public interface CompleteWorkoutUseCase {

    /**
     * Marks today's workout done and logs a WORKOUT activity through the activity feature's use
     * case, which already awards points, feeds the timeline and advances the streak.
     */
    WorkoutToday complete(UUID userId, UUID tenantId);
}
