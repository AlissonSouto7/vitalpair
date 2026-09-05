package com.aps.vitalpair.gamification.domain.port.in;

import java.util.List;
import java.util.UUID;

import com.aps.vitalpair.gamification.application.dto.EarnedBadge;

public interface GetUserBadgesUseCase {

    List<EarnedBadge> getUserBadges(UUID userId);
}
