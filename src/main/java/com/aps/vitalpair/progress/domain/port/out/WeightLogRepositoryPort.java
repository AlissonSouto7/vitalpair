package com.aps.vitalpair.progress.domain.port.out;

import com.aps.vitalpair.progress.domain.model.WeightPoint;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Porta de saída para o histórico de peso ({@code weight_logs}).
 */
public interface WeightLogRepositoryPort {

    /**
     * Registra/atualiza o peso do usuário numa data (upsert por
     * {@code (user_id, recorded_on)}).
     */
    void upsert(UUID userId, LocalDate recordedOn, BigDecimal weightKg);

    /**
     * Histórico de peso do usuário em ordem cronológica (asc por data),
     * limitado aos {@code limit} registros mais recentes.
     */
    List<WeightPoint> findRecentByUser(UUID userId, int limit);
}
