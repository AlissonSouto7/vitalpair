package com.aps.vitalpair.season.domain.port.in;

import java.time.LocalDate;
import java.util.UUID;

import com.aps.vitalpair.season.domain.model.PointSource;

/**
 * Registra um award no ledger de pontos. Chamado pela gamification no MESMO ponto
 * em que o placar da competição é incrementado, garantindo que o ledger bata com o placar.
 */
public interface RecordPointUseCase {

    void record(UUID tenantId, UUID userId, PointSource source, int points, LocalDate date);
}
