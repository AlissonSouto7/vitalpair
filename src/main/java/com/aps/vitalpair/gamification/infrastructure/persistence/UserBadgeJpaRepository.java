package com.aps.vitalpair.gamification.infrastructure.persistence;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserBadgeJpaRepository extends JpaRepository<UserBadgeJpaEntity, UUID> {

    boolean existsByUserIdAndBadgeId(UUID userId, UUID badgeId);

    List<UserBadgeJpaEntity> findByUserId(UUID userId);
}
