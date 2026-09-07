package com.aps.vitalpair.mission.domain.model;

import lombok.Builder;
import lombok.Getter;

/**
 * The computed progress of a weekly mission for the caller (and their partner, when the
 * mission is a pair one). Combines the catalogue item with the real counts.
 */
@Getter
@Builder
public class WeeklyMissionProgress {

    private final WeeklyMission mission;
    /** The caller's progress on the mission's metric. */
    private final int current;
    /** The partner's first name, or {@code null} when the mission is SELF or there is no partner. */
    private final String partnerName;
    /** The partner's progress, or {@code null} when the mission is SELF or there is no partner. */
    private final Integer partnerCurrent;
    /** Whether the mission is complete under the rules of its scope. */
    private final boolean completed;
}
