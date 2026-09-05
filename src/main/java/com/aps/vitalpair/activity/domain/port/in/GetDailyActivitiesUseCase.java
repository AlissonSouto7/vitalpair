package com.aps.vitalpair.activity.domain.port.in;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import com.aps.vitalpair.activity.domain.model.ActivityLog;

public interface GetDailyActivitiesUseCase {

    List<ActivityLog> getActivities(UUID userId, LocalDate date);
}
