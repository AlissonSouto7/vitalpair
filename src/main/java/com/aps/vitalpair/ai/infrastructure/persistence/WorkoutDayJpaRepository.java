package com.aps.vitalpair.ai.infrastructure.persistence;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WorkoutDayJpaRepository extends JpaRepository<WorkoutDayJpaEntity, UUID> {

    List<WorkoutDayJpaEntity> findByPlanId(UUID planId);

    void deleteByPlanId(UUID planId);
}
