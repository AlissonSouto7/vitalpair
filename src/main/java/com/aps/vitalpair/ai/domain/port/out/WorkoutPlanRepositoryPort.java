package com.aps.vitalpair.ai.domain.port.out;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import com.aps.vitalpair.ai.domain.model.WorkoutPlan;

/**
 * Outbound persistence port of the weekly workout plan.
 *
 * <p>As with the meal plan, the tenant enters every read: it is what makes a leaked exercise id
 * useless outside the owning pair.
 */
public interface WorkoutPlanRepositoryPort {

    Optional<WorkoutPlan> findByUserAndWeek(UUID userId, UUID tenantId, LocalDate weekStart);

    /** Saves the plan, replacing the existing one for the same user and week, days and exercises included. */
    WorkoutPlan replace(WorkoutPlan plan);

    /** The whole plan that owns the given exercise, to check ownership before changing it. */
    Optional<WorkoutPlan> findByExerciseId(UUID exerciseId);

    void setExerciseDone(UUID exerciseId, boolean done);

    void setDayCompleted(UUID dayId, LocalDate completedOn);
}
