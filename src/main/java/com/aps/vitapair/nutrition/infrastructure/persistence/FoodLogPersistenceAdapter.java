package com.aps.vitapair.nutrition.infrastructure.persistence;

import com.aps.vitapair.nutrition.domain.model.FoodLog;
import com.aps.vitapair.nutrition.domain.port.out.FoodLogRepositoryPort;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Component;

@Component
public class FoodLogPersistenceAdapter implements FoodLogRepositoryPort {

    private final FoodLogJpaRepository repository;
    private final FoodLogPersistenceMapper mapper;

    public FoodLogPersistenceAdapter(FoodLogJpaRepository repository, FoodLogPersistenceMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    @Override
    public FoodLog save(FoodLog foodLog) {
        return mapper.toDomain(repository.save(mapper.toEntity(foodLog)));
    }

    @Override
    public Optional<FoodLog> findById(UUID id) {
        return repository.findById(id).map(mapper::toDomain);
    }

    @Override
    public List<FoodLog> findByUserAndDate(UUID userId, LocalDate date) {
        Instant start = date.atStartOfDay(ZoneOffset.UTC).toInstant();
        Instant end = date.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant();
        return repository
                .findByUserIdAndLoggedAtGreaterThanEqualAndLoggedAtLessThanOrderByLoggedAtAsc(userId, start, end)
                .stream()
                .map(mapper::toDomain)
                .toList();
    }

    @Override
    public void deleteById(UUID id) {
        repository.deleteById(id);
    }
}
