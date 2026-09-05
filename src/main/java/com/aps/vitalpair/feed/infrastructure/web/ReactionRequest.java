package com.aps.vitalpair.feed.infrastructure.web;

import jakarta.validation.constraints.NotNull;

import com.aps.vitalpair.feed.domain.model.ReactionType;

public record ReactionRequest(@NotNull ReactionType type) {}
