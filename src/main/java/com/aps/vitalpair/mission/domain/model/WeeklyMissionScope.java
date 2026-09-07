package com.aps.vitalpair.mission.domain.model;

/** Whether the weekly mission is individual or for the pair. */
public enum WeeklyMissionScope {
    /** Counts only the user's own progress. */
    SELF,
    /** Exige que os dois membros do par cumpram a meta. */
    PAIR
}
