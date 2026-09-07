package com.aps.vitalpair.mission.domain.model;

import lombok.Builder;
import lombok.Getter;

/** An item of the weekly mission catalogue. Immutable. */
@Getter
@Builder(toBuilder = true)
public class WeeklyMission {

    private final String code;
    private final String title;
    private final String subtitle;
    private final int reward;
    private final int target;
    private final WeeklyMissionMetric metric;
    private final WeeklyMissionScope scope;
    private final WeeklyMissionIcon icon;
    private final int displayOrder;
}
