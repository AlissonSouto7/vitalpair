package com.aps.vitalpair.gamification.domain.port.out;

import java.util.List;
import java.util.UUID;

import com.aps.vitalpair.gamification.domain.model.UserBadge;

public interface UserBadgeRepositoryPort {

    UserBadge save(UserBadge userBadge);

    boolean existsByUserAndBadge(UUID userId, UUID badgeId);

    List<UserBadge> findByUser(UUID userId);
}
