package com.aps.vitapair.activity.domain.port.in;

import com.aps.vitapair.activity.domain.model.ActivityLog;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface GetDailyActivitiesUseCase {

    List<ActivityLog> getActivities(UUID userId, LocalDate date);
}
