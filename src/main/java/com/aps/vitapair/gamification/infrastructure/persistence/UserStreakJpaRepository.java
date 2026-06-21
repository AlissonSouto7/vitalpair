package com.aps.vitapair.gamification.infrastructure.persistence;

import com.aps.vitapair.gamification.domain.model.StreakType;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserStreakJpaRepository extends JpaRepository<UserStreakJpaEntity, UUID> {

    Optional<UserStreakJpaEntity> findByUserIdAndType(UUID userId, StreakType type);

    List<UserStreakJpaEntity> findByUserId(UUID userId);
}
