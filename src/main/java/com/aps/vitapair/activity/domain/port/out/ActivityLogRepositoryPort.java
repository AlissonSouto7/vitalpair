package com.aps.vitapair.activity.domain.port.out;

import com.aps.vitapair.activity.domain.model.ActivityLog;
import java.time.LocalDate;
import java.util.List;

public interface ActivityLogRepositoryPort {

    ActivityLog save(ActivityLog activityLog);

    List<ActivityLog> findByUserAndDate(java.util.UUID userId, LocalDate date);
}
