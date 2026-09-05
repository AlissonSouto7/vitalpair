package com.aps.vitalpair.ai.domain.port.in;

import com.aps.vitalpair.ai.application.dto.WorkoutToday;
import java.util.Optional;
import java.util.UUID;

public interface GetTodayWorkoutUseCase {

    /** Treino de hoje dentro do plano da semana atual; vazio se o plano ainda não foi gerado. */
    Optional<WorkoutToday> getToday(UUID userId);
}
