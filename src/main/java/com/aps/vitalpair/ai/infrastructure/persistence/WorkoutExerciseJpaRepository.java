package com.aps.vitalpair.ai.infrastructure.persistence;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface WorkoutExerciseJpaRepository extends JpaRepository<WorkoutExerciseJpaEntity, UUID> {

    List<WorkoutExerciseJpaEntity> findByDayIdIn(Collection<UUID> dayIds);

    void deleteByDayIdIn(Collection<UUID> dayIds);
}
