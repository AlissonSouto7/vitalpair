package com.aps.vitalpair.nutrition.domain.port.out;

import com.aps.vitalpair.nutrition.domain.model.FavoriteFood;
import com.aps.vitalpair.nutrition.domain.model.FoodLog;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FoodLogRepositoryPort {

    FoodLog save(FoodLog foodLog);

    Optional<FoodLog> findById(UUID id);

    List<FoodLog> findByUserAndDate(UUID userId, LocalDate date);

    /**
     * Alimentos que o usuário mais registrou, ordenados por frequência (desc),
     * limitados a {@code limit}. Os valores nutricionais vêm do registro mais
     * recente de cada {@code foodName}.
     */
    List<FavoriteFood> findTopByUser(UUID userId, int limit);

    void deleteById(UUID id);
}
