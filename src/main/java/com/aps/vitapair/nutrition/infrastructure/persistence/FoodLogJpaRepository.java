package com.aps.vitapair.nutrition.infrastructure.persistence;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FoodLogJpaRepository extends JpaRepository<FoodLogJpaEntity, UUID> {

    List<FoodLogJpaEntity> findByUserIdAndLoggedAtGreaterThanEqualAndLoggedAtLessThanOrderByLoggedAtAsc(
            UUID userId, Instant start, Instant end);
}
