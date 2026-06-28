package com.aps.vitalpair.pair.domain.port.in;

import com.aps.vitalpair.pair.application.dto.PairView;
import com.aps.vitalpair.pair.domain.model.RelationshipType;
import java.util.UUID;

public interface UpdateRelationshipTypeUseCase {

    PairView updateRelationshipType(UUID userId, RelationshipType type);
}
