package com.aps.vitalpair.mission.infrastructure.persistence;

import com.aps.vitalpair.mission.domain.model.MissionKind;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MissionJpaRepository extends JpaRepository<MissionJpaEntity, UUID> {

    List<MissionJpaEntity> findByKindOrderByCodeAsc(MissionKind kind);

    Optional<MissionJpaEntity> findByCode(String code);
}
