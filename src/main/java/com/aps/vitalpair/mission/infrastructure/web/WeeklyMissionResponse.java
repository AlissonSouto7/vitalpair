package com.aps.vitalpair.mission.infrastructure.web;

import com.aps.vitalpair.mission.domain.model.WeeklyMission;
import com.aps.vitalpair.mission.domain.model.WeeklyMissionProgress;

public record WeeklyMissionResponse(
        String code,
        String title,
        String subtitle,
        int reward,
        int target,
        String icon,
        String scope,
        int current,
        String partnerName,
        Integer partnerCurrent,
        boolean completed) {

    public static WeeklyMissionResponse from(WeeklyMissionProgress progress) {
        WeeklyMission mission = progress.getMission();
        return new WeeklyMissionResponse(
                mission.getCode(),
                mission.getTitle(),
                mission.getSubtitle(),
                mission.getReward(),
                mission.getTarget(),
                mission.getIcon().name(),
                mission.getScope().name(),
                progress.getCurrent(),
                progress.getPartnerName(),
                progress.getPartnerCurrent(),
                progress.isCompleted());
    }
}
