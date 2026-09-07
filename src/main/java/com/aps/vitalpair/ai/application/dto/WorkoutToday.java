package com.aps.vitalpair.ai.application.dto;

import java.util.List;
import java.util.UUID;

/**
 * Today's workout: the current weekday within the user's weekly plan. On a rest day
 * {@code rest=true}, {@code focus} and {@code durationMin} are null and {@code exercises} is
 * empty. {@code completed} means the day has already been marked done.
 */
public record WorkoutToday(
        String goal,
        int dayIndex,
        boolean rest,
        String focus,
        Integer durationMin,
        boolean completed,
        List<Exercise> exercises) {

    /** An exercise of today's workout with its tick state ({@code done}). */
    public record Exercise(UUID id, String name, int sets, String reps, int restSeconds, boolean done) {}
}
