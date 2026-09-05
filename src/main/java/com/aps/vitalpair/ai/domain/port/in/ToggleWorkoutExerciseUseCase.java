package com.aps.vitalpair.ai.domain.port.in;

import com.aps.vitalpair.ai.application.dto.WorkoutToday;
import java.util.UUID;

public interface ToggleWorkoutExerciseUseCase {

    /** Inverte o check {@code done} de um exercício do usuário e devolve o treino de hoje atualizado. */
    WorkoutToday toggle(UUID userId, UUID exerciseId);
}
