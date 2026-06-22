package com.aps.vitapair.pair.domain.port.in;

import com.aps.vitapair.pair.application.dto.PairView;
import com.aps.vitapair.pair.domain.model.RelationshipType;
import java.util.UUID;

public interface UpdateRelationshipTypeUseCase {

    PairView updateRelationshipType(UUID userId, RelationshipType type);
}
