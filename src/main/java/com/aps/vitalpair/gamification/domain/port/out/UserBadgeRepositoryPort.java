package com.aps.vitalpair.gamification.domain.port.out;

import com.aps.vitalpair.gamification.domain.model.UserBadge;
import java.util.List;
import java.util.UUID;

public interface UserBadgeRepositoryPort {

    UserBadge save(UserBadge userBadge);

    boolean existsByUserAndBadge(UUID userId, UUID badgeId);

    List<UserBadge> findByUser(UUID userId);
}
