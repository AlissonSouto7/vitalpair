package com.aps.vitalpair.season.infrastructure.persistence;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.aps.vitalpair.season.domain.model.SeasonStatus;

public interface SeasonJpaRepository extends JpaRepository<SeasonJpaEntity, UUID> {

    Optional<SeasonJpaEntity> findByTenantIdAndStatus(UUID tenantId, SeasonStatus status);

    List<SeasonJpaEntity> findByTenantIdAndStatusOrderByNumberDesc(UUID tenantId, SeasonStatus status);
}
