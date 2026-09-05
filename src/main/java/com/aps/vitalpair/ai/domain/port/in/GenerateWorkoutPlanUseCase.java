package com.aps.vitalpair.ai.domain.port.in;

import java.util.UUID;

import com.aps.vitalpair.ai.application.dto.WorkoutToday;

public interface GenerateWorkoutPlanUseCase {

    /** Gera o plano de treino da semana atual via IA (substitui o existente) e devolve o treino de hoje. */
    WorkoutToday generate(UUID userId);
}
