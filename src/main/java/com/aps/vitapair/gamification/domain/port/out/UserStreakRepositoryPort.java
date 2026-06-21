package com.aps.vitapair.gamification.domain.port.out;

import com.aps.vitapair.gamification.domain.model.StreakType;
import com.aps.vitapair.gamification.domain.model.UserStreak;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserStreakRepositoryPort {

    UserStreak save(UserStreak streak);

    Optional<UserStreak> findByUserAndType(UUID userId, StreakType type);

    List<UserStreak> findByUser(UUID userId);
}
