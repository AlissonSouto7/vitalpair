package com.aps.vitalpair.gamification.domain.port.in;

import com.aps.vitalpair.gamification.application.dto.EarnedBadge;
import java.util.List;
import java.util.UUID;

public interface GetUserBadgesUseCase {

    List<EarnedBadge> getUserBadges(UUID userId);
}
