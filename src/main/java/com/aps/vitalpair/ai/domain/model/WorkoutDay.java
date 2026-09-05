package com.aps.vitalpair.ai.domain.model;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Um dia do plano de treino ({@code dayIndex} 0 = segunda ... 6 = domingo).
 * Dia de descanso: {@code rest=true}, {@code focus}/{@code durationMin} nulos e sem exercícios.
 * {@code completedOn} guarda a data em que o usuário concluiu o treino (nulo = não concluído).
 */
public record WorkoutDay(
        UUID id,
        int dayIndex,
        String focus,
        Integer durationMin,
        boolean rest,
        LocalDate completedOn,
        List<WorkoutExercise> exercises) {
}
