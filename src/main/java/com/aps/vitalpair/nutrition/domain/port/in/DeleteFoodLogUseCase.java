package com.aps.vitalpair.nutrition.domain.port.in;

import java.util.UUID;

public interface DeleteFoodLogUseCase {

    void delete(UUID userId, UUID foodLogId);
}
