package com.aps.vitapair.nutrition.domain.port.out;

import com.aps.vitapair.nutrition.domain.model.FoodLog;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FoodLogRepositoryPort {

    FoodLog save(FoodLog foodLog);

    Optional<FoodLog> findById(UUID id);

    List<FoodLog> findByUserAndDate(UUID userId, LocalDate date);

    void deleteById(UUID id);
}
