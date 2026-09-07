package com.aps.vitalpair.season.domain.port.in;

import java.time.LocalDate;
import java.util.UUID;

import com.aps.vitalpair.season.domain.model.PointSource;

/**
 * Records an award in the points ledger. Called by gamification at the SAME point where the
 * competition scoreboard is incremented, which is what keeps the ledger equal to the
 * scoreboard.
 */
public interface RecordPointUseCase {

    void record(UUID tenantId, UUID userId, PointSource source, int points, LocalDate date);
}
