package com.aps.vitalpair.ai.domain.model;

import java.util.UUID;

/**
 * Um exercício de um dia de treino. {@code reps} é texto livre curto ("12 reps", "40s");
 * {@code done} marca o check individual do usuário durante o treino.
 */
public record WorkoutExercise(
        UUID id,
        int position,
        String name,
        int sets,
        String reps,
        int restSeconds,
        boolean done) {
}
