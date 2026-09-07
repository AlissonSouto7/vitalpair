package com.aps.vitalpair.ai.infrastructure.persistence;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface MealPlanItemJpaRepository extends JpaRepository<MealPlanItemJpaEntity, UUID> {

    List<MealPlanItemJpaEntity> findByPlanId(UUID planId);

    /** Scoped by plan so an item id from another user's plan finds nothing. */
    Optional<MealPlanItemJpaEntity> findByIdAndPlanId(UUID id, UUID planId);

    void deleteByPlanId(UUID planId);
}
