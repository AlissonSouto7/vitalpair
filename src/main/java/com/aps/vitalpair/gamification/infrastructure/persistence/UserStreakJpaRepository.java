package com.aps.vitalpair.gamification.infrastructure.persistence;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.aps.vitalpair.gamification.domain.model.StreakType;

public interface UserStreakJpaRepository extends JpaRepository<UserStreakJpaEntity, UUID> {

    Optional<UserStreakJpaEntity> findByUserIdAndType(UUID userId, StreakType type);

    List<UserStreakJpaEntity> findByUserId(UUID userId);
}
