package com.aps.vitalpair.nutrition.infrastructure.persistence;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;

import com.aps.vitalpair.nutrition.domain.model.FavoriteFood;
import com.aps.vitalpair.nutrition.domain.model.FoodLog;
import com.aps.vitalpair.nutrition.domain.port.out.FoodLogRepositoryPort;

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
    public List<FavoriteFood> findTopByUser(UUID userId, int limit) {
        return repository.findFavoriteCountsByUser(userId, PageRequest.of(0, limit)).stream()
                .map(view -> {
                    FoodLogJpaEntity representative =
                            repository.findFirstByUserIdAndFoodNameOrderByLoggedAtDesc(userId, view.getFoodName());
                    return new FavoriteFood(
                            view.getFoodName(),
                            representative.getQuantityG(),
                            representative.getCaloriesKcal(),
                            representative.getProteinG(),
                            representative.getCarbG(),
                            representative.getFatG(),
                            view.getCount());
                })
                .toList();
    }

    @Override
    public void deleteById(UUID id) {
        repository.deleteById(id);
    }
}
