package com.aps.vitalpair.feed.infrastructure.web;

import com.aps.vitalpair.feed.domain.model.ReactionType;
import jakarta.validation.constraints.NotNull;

public record ReactionRequest(@NotNull ReactionType type) {
}
