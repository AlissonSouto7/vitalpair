package com.aps.vitalpair.mission.domain.port.in;

import java.util.List;
import java.util.UUID;

import com.aps.vitalpair.mission.domain.model.WeeklyMissionProgress;

/** Use case: the current week's missions with the user's real progress. */
public interface GetWeeklyMissionsUseCase {

    List<WeeklyMissionProgress> getCurrentWeek(UUID userId);
}
