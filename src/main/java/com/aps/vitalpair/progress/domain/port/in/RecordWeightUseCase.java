package com.aps.vitalpair.progress.domain.port.in;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Use case: record a user's weight for TODAY (an upsert per day). Called by the progress
 * endpoint and also by the {@code user} feature when the profile weight changes, so it becomes
 * a history point without a dependency cycle.
 */
public interface RecordWeightUseCase {

    /**
     * Records or replaces the user's weight for today.
     *
     * @param userId   the user
     * @param weightKg the weight in kilograms
     */
    void recordTodayWeight(UUID userId, BigDecimal weightKg);
}
