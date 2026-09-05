package com.aps.vitalpair.ai.domain.port.in;

import java.util.Optional;
import java.util.UUID;

import com.aps.vitalpair.ai.application.dto.WorkoutToday;

public interface GetTodayWorkoutUseCase {

    /** Treino de hoje dentro do plano da semana atual; vazio se o plano ainda não foi gerado. */
    Optional<WorkoutToday> getToday(UUID userId);
}
