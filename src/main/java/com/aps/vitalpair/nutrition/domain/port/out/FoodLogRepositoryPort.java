package com.aps.vitalpair.nutrition.domain.port.out;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.aps.vitalpair.nutrition.domain.model.FavoriteFood;
import com.aps.vitalpair.nutrition.domain.model.FoodLog;
import com.aps.vitalpair.shared.time.DayWindow;

public interface FoodLogRepositoryPort {

    FoodLog save(FoodLog foodLog);

    Optional<FoodLog> findById(UUID id);

    /**
     * The user's meals inside a day.
     *
     * <p>Takes the window rather than a date because a date alone does not say which zone it
     * belongs to, and the adapter guessing UTC is exactly the bug this replaced: the caller
     * decided "today" in one zone while the query ran in another, so meals logged in the last
     * hours of the day fell outside it.
     */
    List<FoodLog> findByUserAndDay(UUID userId, DayWindow day);

    /**
     * The foods the user logged most, ordered by frequency descending and limited to
     * {@code limit}. The nutrition values come from the most recent entry of each
     * {@code foodName}.
     */
    List<FavoriteFood> findTopByUser(UUID userId, int limit);

    void deleteById(UUID id);
}
