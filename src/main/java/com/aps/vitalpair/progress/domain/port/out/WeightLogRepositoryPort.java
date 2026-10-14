package com.aps.vitalpair.progress.domain.port.out;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.aps.vitalpair.progress.domain.model.WeightPoint;

/**
 * Outbound port to the weight history ({@code weight_logs}).
 */
public interface WeightLogRepositoryPort {

    /**
     * Records or replaces the user's weight on a date (an upsert on
     * {@code (user_id, recorded_on)}).
     */
    void upsert(UUID userId, LocalDate recordedOn, BigDecimal weightKg);

    /**
     * The user's weight history in chronological order (ascending by date), limited to the
     * {@code limit} most recent records.
     */
    List<WeightPoint> findRecentByUser(UUID userId, int limit);

    /**
     * The earliest weight on record for this user, or empty when they have never weighed in.
     *
     * <p>Separate from {@link #findRecentByUser} because that one is capped: somebody with
     * two years of weekly weighings has their first record well outside the window, and it is
     * exactly that record the weight badges measure against.
     */
    Optional<BigDecimal> findStartWeight(UUID userId);
}
