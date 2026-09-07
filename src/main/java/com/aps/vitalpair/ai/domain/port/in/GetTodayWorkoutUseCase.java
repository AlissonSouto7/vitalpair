package com.aps.vitalpair.ai.domain.port.in;

import java.util.Optional;
import java.util.UUID;

import com.aps.vitalpair.ai.application.dto.WorkoutToday;

public interface GetTodayWorkoutUseCase {

    /** Today's workout within the current week's plan; empty when the plan is not generated yet. */
    Optional<WorkoutToday> getToday(UUID userId, UUID tenantId);
}
