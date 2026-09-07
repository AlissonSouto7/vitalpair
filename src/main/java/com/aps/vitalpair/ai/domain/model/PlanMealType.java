package com.aps.vitalpair.ai.domain.model;

/**
 * A meal of the meal plan. Declaration order is the day's display order (breakfast, lunch,
 * snack, dinner) and is what orders the API responses.
 */
public enum PlanMealType {
    BREAKFAST,
    LUNCH,
    SNACK,
    DINNER
}
