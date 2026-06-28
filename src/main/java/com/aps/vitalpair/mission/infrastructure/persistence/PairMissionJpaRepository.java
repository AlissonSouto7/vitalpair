package com.aps.vitalpair.mission.infrastructure.persistence;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PairMissionJpaRepository extends JpaRepository<PairMissionJpaEntity, UUID> {

    Optional<PairMissionJpaEntity> findByTenantIdAndMissionDate(UUID tenantId, LocalDate missionDate);
}
