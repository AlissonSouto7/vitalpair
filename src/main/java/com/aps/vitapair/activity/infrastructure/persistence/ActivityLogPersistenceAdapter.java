package com.aps.vitapair.activity.infrastructure.persistence;

import com.aps.vitapair.activity.domain.model.ActivityLog;
import com.aps.vitapair.activity.domain.port.out.ActivityLogRepositoryPort;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Component;

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
    public List<ActivityLog> findByUserAndDate(UUID userId, LocalDate date) {
        Instant start = date.atStartOfDay(ZoneOffset.UTC).toInstant();
        Instant end = date.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant();
        return repository
                .findByUserIdAndLoggedAtGreaterThanEqualAndLoggedAtLessThanOrderByLoggedAtAsc(userId, start, end)
                .stream()
                .map(mapper::toDomain)
                .toList();
    }
}
