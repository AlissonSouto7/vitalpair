package com.aps.vitalpair.activity.infrastructure.persistence;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Component;

import com.aps.vitalpair.activity.domain.model.ActivityLog;
import com.aps.vitalpair.activity.domain.port.out.ActivityLogRepositoryPort;
import com.aps.vitalpair.shared.time.DayWindow;

@Component
public class ActivityLogPersistenceAdapter implements ActivityLogRepositoryPort {

    private final ActivityLogJpaRepository repository;
    private final ActivityLogPersistenceMapper mapper;

    public ActivityLogPersistenceAdapter(ActivityLogJpaRepository repository, ActivityLogPersistenceMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    @Override
    public ActivityLog save(ActivityLog activityLog) {
        return mapper.toDomain(repository.save(mapper.toEntity(activityLog)));
    }

    @Override
    public List<ActivityLog> findByUserAndDay(UUID userId, DayWindow day) {
        return repository
                .findByUserIdAndLoggedAtGreaterThanEqualAndLoggedAtLessThanOrderByLoggedAtAsc(
                        userId, day.start(), day.end())
                .stream()
                .map(mapper::toDomain)
                .toList();
    }
}
