package com.aps.vitalpair.ai.domain.port.in;

import com.aps.vitalpair.ai.application.dto.WorkoutToday;
import java.util.UUID;

public interface CompleteWorkoutUseCase {

    /**
     * Marca o treino de hoje como concluído e registra uma atividade WORKOUT pelo use case
     * da feature activity (que já dispara pontos/feed/streak).
     */
    WorkoutToday complete(UUID userId);
}
