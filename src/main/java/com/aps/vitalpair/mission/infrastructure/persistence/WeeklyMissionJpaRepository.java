package com.aps.vitalpair.mission.infrastructure.persistence;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface WeeklyMissionJpaRepository extends JpaRepository<WeeklyMissionJpaEntity, UUID> {

    List<WeeklyMissionJpaEntity> findAllByOrderByDisplayOrderAsc();
}
