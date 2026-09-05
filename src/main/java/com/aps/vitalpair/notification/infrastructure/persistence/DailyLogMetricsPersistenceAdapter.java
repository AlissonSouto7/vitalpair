package com.aps.vitalpair.notification.infrastructure.persistence;

import java.time.Instant;
import java.util.UUID;

import org.springframework.stereotype.Component;

import com.aps.vitalpair.notification.domain.port.out.DailyLogMetricsRepositoryPort;

@Component
public class DailyLogMetricsPersistenceAdapter implements DailyLogMetricsRepositoryPort {

    private final DailyLogMetricsJpaRepository repository;

    public DailyLogMetricsPersistenceAdapter(DailyLogMetricsJpaRepository repository) {
        this.repository = repository;
    }

    @Override
    public long countFoodLogs(UUID userId, Instant start, Instant end) {
        return repository.countFoodLogs(userId, start, end);
    }

    @Override
    public long countActivityLogs(UUID userId, Instant start, Instant end) {
        return repository.countActivityLogs(userId, start, end);
    }
}
