package com.aps.vitalpair.gamification.infrastructure.persistence;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BadgeJpaRepository extends JpaRepository<BadgeJpaEntity, UUID> {

    Optional<BadgeJpaEntity> findByCode(String code);
}
