package com.aps.vitalpair.mission.infrastructure.persistence;

import com.aps.vitalpair.mission.domain.port.out.WeeklyMissionMetricsRepositoryPort;
import java.time.Instant;
import java.util.UUID;
import org.springframework.stereotype.Component;

@Component
public class WeeklyMissionMetricsPersistenceAdapter implements WeeklyMissionMetricsRepositoryPort {

    private final WeeklyMissionMetricsJpaRepository repository;

    public WeeklyMissionMetricsPersistenceAdapter(WeeklyMissionMetricsJpaRepository repository) {
        this.repository = repository;
    }

    @Override
    public int countMealDays(UUID userId, Instant start, Instant end) {
        return Math.toIntExact(repository.countMealDays(userId, start, end));
    }

    @Override
    public int countWorkouts(UUID userId, Instant start, Instant end) {
        return Math.toIntExact(repository.countWorkouts(userId, start, end));
    }
}
