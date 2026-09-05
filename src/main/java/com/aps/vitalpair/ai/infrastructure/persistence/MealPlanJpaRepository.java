package com.aps.vitalpair.ai.infrastructure.persistence;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface MealPlanJpaRepository extends JpaRepository<MealPlanJpaEntity, UUID> {

    Optional<MealPlanJpaEntity> findByUserIdAndWeekStart(UUID userId, LocalDate weekStart);
}
