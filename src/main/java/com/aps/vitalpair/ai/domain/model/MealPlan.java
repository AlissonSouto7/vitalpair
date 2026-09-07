package com.aps.vitalpair.ai.domain.model;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * An AI-generated weekly meal plan. {@code weekStart} is always the week's Monday; {@code items}
 * covers 7 days x 4 meals. Immutable; null ids mean the plan is not persisted yet.
 *
 * <p>{@code tenantId} travels with the plan because every row of user-owned data is scoped by
 * the owning pair: without it the NOT NULL column from V22 could not be filled and reads could
 * not be filtered by tenant.
 */
public record MealPlan(
        UUID id, UUID userId, UUID tenantId, LocalDate weekStart, Instant createdAt, List<MealPlanItem> items) {}
