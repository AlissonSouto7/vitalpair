package com.aps.vitalpair.nutrition.infrastructure.persistence;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface FoodLogJpaRepository extends JpaRepository<FoodLogJpaEntity, UUID> {

    List<FoodLogJpaEntity> findByUserIdAndLoggedAtGreaterThanEqualAndLoggedAtLessThanOrderByLoggedAtAsc(
            UUID userId, Instant start, Instant end);

    /**
     * The food names the user logged most, ordered by frequency descending. Scoped by user, like
     * every other query here.
     */
    @Query(
            """
            SELECT f.foodName AS foodName, COUNT(f) AS count
            FROM FoodLogJpaEntity f
            WHERE f.userId = :userId
            GROUP BY f.foodName
            ORDER BY COUNT(f) DESC, MAX(f.loggedAt) DESC
            """)
    List<FavoriteFoodCountView> findFavoriteCountsByUser(@Param("userId") UUID userId, Pageable pageable);

    /**
     * The user's most recent entry of a given food, used as the favourite's representative
     * nutrition values.
     */
    FoodLogJpaEntity findFirstByUserIdAndFoodNameOrderByLoggedAtDesc(UUID userId, String foodName);

    /** The projection of the count per food name. */
    interface FavoriteFoodCountView {
        String getFoodName();

        long getCount();
    }
}
