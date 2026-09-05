package com.aps.vitalpair.activity.domain.port.out;

import java.time.LocalDate;
import java.util.List;

import com.aps.vitalpair.activity.domain.model.ActivityLog;

public interface ActivityLogRepositoryPort {

    ActivityLog save(ActivityLog activityLog);

    List<ActivityLog> findByUserAndDate(java.util.UUID userId, LocalDate date);
}
