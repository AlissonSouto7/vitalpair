package com.aps.vitalpair.notification.domain.port.out;

import java.time.Instant;
import java.util.UUID;

/** Read-only counts of a user's records in an interval, for the end-of-day reminder. */
public interface DailyLogMetricsRepositoryPort {

    long countFoodLogs(UUID userId, Instant start, Instant end);

    long countActivityLogs(UUID userId, Instant start, Instant end);
}
