package com.aps.vitalpair.ai.domain.model;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import com.aps.vitalpair.user.domain.model.Goal;

/**
 * An AI-generated weekly workout plan. {@code weekStart} is always the week's Monday;
 * {@code days} covers all 7 days (days without training carry {@code rest=true}).
 *
 * <p>{@code tenantId} travels with the plan for the same reason as in {@link MealPlan}: the row
 * belongs to the pair, and every read filters by it.
 */
public record WorkoutPlan(UUID id, UUID userId, UUID tenantId, LocalDate weekStart, Goal goal, List<WorkoutDay> days) {}
