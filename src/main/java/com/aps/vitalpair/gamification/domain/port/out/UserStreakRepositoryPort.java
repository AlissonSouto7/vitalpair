package com.aps.vitalpair.gamification.domain.port.out;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.aps.vitalpair.gamification.domain.model.StreakType;
import com.aps.vitalpair.gamification.domain.model.UserStreak;

public interface UserStreakRepositoryPort {

    UserStreak save(UserStreak streak);

    Optional<UserStreak> findByUserAndType(UUID userId, StreakType type);

    List<UserStreak> findByUser(UUID userId);
}
