package com.aps.vitalpair.pair.infrastructure.web;

import com.aps.vitalpair.pair.domain.model.RelationshipType;
import jakarta.validation.constraints.NotNull;

public record UpdateRelationshipTypeRequest(@NotNull RelationshipType type) {
}
