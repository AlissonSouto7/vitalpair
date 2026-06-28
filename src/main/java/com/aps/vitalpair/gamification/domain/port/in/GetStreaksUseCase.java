package com.aps.vitalpair.gamification.domain.port.in;

import com.aps.vitalpair.gamification.domain.model.UserStreak;
import java.util.List;
import java.util.UUID;

public interface GetStreaksUseCase {

    List<UserStreak> getStreaks(UUID userId);
}
