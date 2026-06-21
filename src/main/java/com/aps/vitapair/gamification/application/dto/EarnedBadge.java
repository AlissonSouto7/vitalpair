package com.aps.vitapair.gamification.application.dto;

import com.aps.vitapair.gamification.domain.model.Badge;
import java.time.Instant;

/** Uma conquista do usuário com a data em que foi obtida. */
public record EarnedBadge(Badge badge, Instant earnedAt) {
}
