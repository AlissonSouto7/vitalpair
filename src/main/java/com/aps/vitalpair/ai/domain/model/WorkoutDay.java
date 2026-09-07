package com.aps.vitalpair.ai.domain.model;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * One day of the workout plan ({@code dayIndex} 0 = Monday ... 6 = Sunday). A rest day has
 * {@code rest=true}, null {@code focus} and {@code durationMin}, and no exercises.
 * {@code completedOn} holds the date the user completed the workout (null = not completed).
 */
public record WorkoutDay(
        UUID id,
        int dayIndex,
        String focus,
        Integer durationMin,
        boolean rest,
        LocalDate completedOn,
        List<WorkoutExercise> exercises) {}
