package com.aps.vitalpair.ai.infrastructure.persistence;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface WorkoutPlanJpaRepository extends JpaRepository<WorkoutPlanJpaEntity, UUID> {

    Optional<WorkoutPlanJpaEntity> findByUserIdAndTenantIdAndWeekStart(UUID userId, UUID tenantId, LocalDate weekStart);
}
