package com.aps.vitalpair.ai.domain.model;

import java.util.UUID;

/**
 * One exercise of a training day. {@code reps} is short free text ("12 reps", "40s");
 * {@code done} is the user's individual tick during the workout.
 */
public record WorkoutExercise(
        UUID id, int position, String name, int sets, String reps, int restSeconds, boolean done) {}
