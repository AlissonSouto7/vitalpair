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
     * Nomes dos alimentos que o usuário mais registrou, ordenados por
     * frequência (desc). Isolado por usuário, igual às demais queries.
     */
    @Query("""
            SELECT f.foodName AS foodName, COUNT(f) AS count
            FROM FoodLogJpaEntity f
            WHERE f.userId = :userId
            GROUP BY f.foodName
            ORDER BY COUNT(f) DESC, MAX(f.loggedAt) DESC
            """)
    List<FavoriteFoodCountView> findFavoriteCountsByUser(@Param("userId") UUID userId, Pageable pageable);

    /**
     * Registro mais recente de um determinado alimento para o usuário,
     * usado como valor nutricional representativo do favorito.
     */
    FoodLogJpaEntity findFirstByUserIdAndFoodNameOrderByLoggedAtDesc(UUID userId, String foodName);

    /** Projeção da contagem por nome de alimento. */
    interface FavoriteFoodCountView {
        String getFoodName();

        long getCount();
    }
}
