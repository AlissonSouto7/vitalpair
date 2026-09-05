package com.aps.vitalpair.ai.infrastructure.persistence;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MealPlanItemJpaRepository extends JpaRepository<MealPlanItemJpaEntity, UUID> {

    List<MealPlanItemJpaEntity> findByPlanId(UUID planId);

    void deleteByPlanId(UUID planId);
}
