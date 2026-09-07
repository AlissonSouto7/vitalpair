package com.aps.vitalpair.ai.domain.port.out;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import com.aps.vitalpair.ai.domain.model.MealPlan;

/**
 * Outbound persistence port of the weekly meal plan.
 *
 * <p>Every operation takes the tenant as well as the user. Filtering by {@code userId} alone
 * would work, since a user belongs to one pair, but it would leave the row reachable by any
 * query that forgot the filter; with the tenant explicit, an id from another pair simply finds
 * nothing.
 */
public interface MealPlanRepositoryPort {

    Optional<MealPlan> findByUserAndWeek(UUID userId, UUID tenantId, LocalDate weekStart);

    /** Saves the plan, replacing the existing one for the same user and week, items included. */
    MealPlan replace(MealPlan plan);

    /**
     * Updates the dish of an existing item (a meal swap), keeping its day and type.
     *
     * @param planId the plan the item must belong to; an item of another plan is left untouched
     */
    void updateItem(UUID planId, UUID itemId, String name, int kcal, int proteinG, int carbG, int fatG);
}
