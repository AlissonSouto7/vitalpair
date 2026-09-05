package com.aps.vitalpair.pair.infrastructure.persistence;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PairJpaRepository extends JpaRepository<PairJpaEntity, UUID> {

    Optional<PairJpaEntity> findByInviteCode(String inviteCode);
}
