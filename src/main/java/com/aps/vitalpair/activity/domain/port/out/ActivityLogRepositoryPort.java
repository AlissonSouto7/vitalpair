package com.aps.vitalpair.activity.domain.port.out;

import java.util.List;
import java.util.UUID;

import com.aps.vitalpair.activity.domain.model.ActivityLog;
import com.aps.vitalpair.shared.time.DayWindow;

public interface ActivityLogRepositoryPort {

    ActivityLog save(ActivityLog activityLog);

    /**
     * The user's activities inside a day.
     *
     * <p>Takes the window rather than a date because a date alone does not say which zone it
     * belongs to, and the adapter guessing UTC is exactly the bug this replaced.
     */
    List<ActivityLog> findByUserAndDay(UUID userId, DayWindow day);
}
