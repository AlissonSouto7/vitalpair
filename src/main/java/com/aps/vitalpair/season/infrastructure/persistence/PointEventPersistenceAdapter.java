package com.aps.vitalpair.season.infrastructure.persistence;

import com.aps.vitalpair.season.domain.model.PointEvent;
import com.aps.vitalpair.season.domain.port.out.PointEventRepositoryPort;
import com.aps.vitalpair.season.domain.port.out.projection.DayUserPoints;
import com.aps.vitalpair.season.domain.port.out.projection.SourceUserPoints;
import com.aps.vitalpair.season.domain.port.out.projection.UserPoints;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Component;

@Component
public class PointEventPersistenceAdapter implements PointEventRepositoryPort {

    private final PointEventJpaRepository repository;
    private final PointEventPersistenceMapper mapper;

    public PointEventPersistenceAdapter(
            PointEventJpaRepository repository, PointEventPersistenceMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    @Override
    public PointEvent save(PointEvent event) {
        return mapper.toDomain(repository.save(mapper.toEntity(event)));
    }

    @Override
    public List<UserPoints> sumByUser(UUID tenantId, Instant start, Instant end) {
        return repository.sumByUser(tenantId, start, end);
    }

    @Override
    public List<DayUserPoints> sumByDayAndUser(UUID tenantId, Instant start, Instant end) {
        return repository.sumByDayAndUser(tenantId, start, end);
    }

    @Override
    public List<SourceUserPoints> sumBySourceAndUser(UUID tenantId, Instant start, Instant end) {
        return repository.sumBySourceAndUser(tenantId, start, end);
    }
}
