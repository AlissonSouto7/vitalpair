package com.aps.vitalpair.season.domain.port.in;

import com.aps.vitalpair.season.domain.model.PointSource;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Registra um award no ledger de pontos. Chamado pela gamification no MESMO ponto
 * em que o placar da competição é incrementado, garantindo que o ledger bata com o placar.
 */
public interface RecordPointUseCase {

    void record(UUID tenantId, UUID userId, PointSource source, int points, LocalDate date);
}
