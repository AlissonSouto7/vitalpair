package com.aps.vitalpair.ai.domain.port.in;

import java.util.UUID;

import com.aps.vitalpair.ai.application.dto.WorkoutToday;

public interface ToggleWorkoutExerciseUseCase {

    /** Inverte o check {@code done} de um exercício do usuário e devolve o treino de hoje atualizado. */
    WorkoutToday toggle(UUID userId, UUID exerciseId);
}
