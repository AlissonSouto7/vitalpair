package com.aps.vitalpair.gamification.domain.port.in;

import java.util.List;
import java.util.UUID;

import com.aps.vitalpair.gamification.domain.model.UserStreak;

public interface GetStreaksUseCase {

    List<UserStreak> getStreaks(UUID userId);
}
