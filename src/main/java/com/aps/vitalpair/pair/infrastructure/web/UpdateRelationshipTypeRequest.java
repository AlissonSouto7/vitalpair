package com.aps.vitalpair.pair.infrastructure.web;

import jakarta.validation.constraints.NotNull;

import com.aps.vitalpair.pair.domain.model.RelationshipType;

public record UpdateRelationshipTypeRequest(@NotNull RelationshipType type) {}
