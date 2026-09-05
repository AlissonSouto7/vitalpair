package com.aps.vitalpair.ai.domain.port.in;

import java.util.UUID;

import com.aps.vitalpair.ai.application.dto.WorkoutToday;

public interface CompleteWorkoutUseCase {

    /**
     * Marca o treino de hoje como concluído e registra uma atividade WORKOUT pelo use case
     * da feature activity (que já dispara pontos/feed/streak).
     */
    WorkoutToday complete(UUID userId);
}
