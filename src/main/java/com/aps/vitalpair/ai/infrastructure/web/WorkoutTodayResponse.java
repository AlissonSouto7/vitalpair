package com.aps.vitalpair.ai.infrastructure.web;

import java.util.List;
import java.util.UUID;

import com.aps.vitalpair.ai.application.dto.WorkoutToday;

/**
 * Contrato do treino de hoje para o frontend. Em dia de descanso, {@code rest=true},
 * {@code focus}/{@code durationMin} nulos e {@code exercises} vazio.
 */
public record WorkoutTodayResponse(
        String goal,
        int dayIndex,
        boolean rest,
        String focus,
        Integer durationMin,
        boolean completed,
        List<Exercise> exercises) {

    public record Exercise(UUID id, String name, int sets, String reps, int restSeconds, boolean done) {}

    public static WorkoutTodayResponse from(WorkoutToday today) {
        List<Exercise> exercises = today.exercises().stream()
                .map(exercise -> new Exercise(
                        exercise.id(),
                        exercise.name(),
                        exercise.sets(),
                        exercise.reps(),
                        exercise.restSeconds(),
                        exercise.done()))
                .toList();
        return new WorkoutTodayResponse(
                today.goal(),
                today.dayIndex(),
                today.rest(),
                today.focus(),
                today.durationMin(),
                today.completed(),
                exercises);
    }
}
