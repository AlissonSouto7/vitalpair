package com.aps.vitapair.pair.infrastructure.web;

import com.aps.vitapair.pair.domain.model.RelationshipType;
import jakarta.validation.constraints.NotNull;

public record UpdateRelationshipTypeRequest(@NotNull RelationshipType type) {
}
