package com.aps.vitalpair.pair.domain.port.in;

import java.util.UUID;

import com.aps.vitalpair.pair.application.dto.PairView;
import com.aps.vitalpair.pair.domain.model.RelationshipType;

public interface UpdateRelationshipTypeUseCase {

    PairView updateRelationshipType(UUID userId, RelationshipType type);
}
