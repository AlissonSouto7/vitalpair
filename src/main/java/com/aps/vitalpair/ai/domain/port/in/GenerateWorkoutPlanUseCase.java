package com.aps.vitalpair.ai.domain.port.in;

import com.aps.vitalpair.ai.application.dto.WorkoutToday;
import java.util.UUID;

public interface GenerateWorkoutPlanUseCase {

    /** Gera o plano de treino da semana atual via IA (substitui o existente) e devolve o treino de hoje. */
    WorkoutToday generate(UUID userId);
}
