package com.aps.vitapair.feed.infrastructure.web;

import com.aps.vitapair.feed.domain.model.ReactionType;
import jakarta.validation.constraints.NotNull;

public record ReactionRequest(@NotNull ReactionType type) {
}
