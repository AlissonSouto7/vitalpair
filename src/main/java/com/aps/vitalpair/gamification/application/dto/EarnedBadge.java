package com.aps.vitalpair.gamification.application.dto;

import java.time.Instant;

import com.aps.vitalpair.gamification.domain.model.Badge;

/** Uma conquista do usuário com a data em que foi obtida. */
public record EarnedBadge(Badge badge, Instant earnedAt) {}
