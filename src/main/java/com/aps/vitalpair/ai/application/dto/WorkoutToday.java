package com.aps.vitalpair.ai.application.dto;

import java.util.List;
import java.util.UUID;

/**
 * Visão do treino de hoje: o dia da semana atual dentro do plano semanal do usuário.
 * Em dia de descanso, {@code rest=true}, {@code focus}/{@code durationMin} nulos e
 * {@code exercises} vazio. {@code completed} = o dia já foi marcado como concluído.
 */
public record WorkoutToday(
        String goal,
        int dayIndex,
        boolean rest,
        String focus,
        Integer durationMin,
        boolean completed,
        List<Exercise> exercises) {

    /** Exercício do treino de hoje com o estado do check ({@code done}). */
    public record Exercise(UUID id, String name, int sets, String reps, int restSeconds, boolean done) {}
}
