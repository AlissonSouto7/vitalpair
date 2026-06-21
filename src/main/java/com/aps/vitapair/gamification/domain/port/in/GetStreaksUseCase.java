package com.aps.vitapair.gamification.domain.port.in;

import com.aps.vitapair.gamification.domain.model.UserStreak;
import java.util.List;
import java.util.UUID;

public interface GetStreaksUseCase {

    List<UserStreak> getStreaks(UUID userId);
}
