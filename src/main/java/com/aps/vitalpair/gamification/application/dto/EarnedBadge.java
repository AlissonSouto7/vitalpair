package com.aps.vitalpair.gamification.application.dto;

import java.time.Instant;

import com.aps.vitalpair.gamification.domain.model.Badge;

/** A badge the user earned, with the moment it was earned. */
public record EarnedBadge(Badge badge, Instant earnedAt) {}
