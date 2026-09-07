package com.aps.vitalpair.mission.domain.model;

/** How the progress of a weekly mission is counted. */
public enum WeeklyMissionMetric {
    /** Distinct days on which the user logged at least one meal. */
    MEAL_DAYS,
    /** The user's activities whose type is not STEPS. */
    WORKOUTS
}
