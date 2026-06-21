package com.aps.vitapair.gamification.domain.port.in;

import com.aps.vitapair.gamification.application.dto.EarnedBadge;
import java.util.List;
import java.util.UUID;

public interface GetUserBadgesUseCase {

    List<EarnedBadge> getUserBadges(UUID userId);
}
