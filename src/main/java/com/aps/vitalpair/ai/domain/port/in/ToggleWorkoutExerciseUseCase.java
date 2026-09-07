package com.aps.vitalpair.ai.domain.port.in;

import java.util.UUID;

import com.aps.vitalpair.ai.application.dto.WorkoutToday;

public interface ToggleWorkoutExerciseUseCase {

    /** Flips the {@code done} tick of one of the user's exercises and returns today's updated workout. */
    WorkoutToday toggle(UUID userId, UUID tenantId, UUID exerciseId);
}
