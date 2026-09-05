package com.aps.vitalpair.season.domain.port.out;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import com.aps.vitalpair.season.domain.model.PointEvent;
import com.aps.vitalpair.season.domain.port.out.projection.DayUserPoints;
import com.aps.vitalpair.season.domain.port.out.projection.SourceUserPoints;
import com.aps.vitalpair.season.domain.port.out.projection.UserPoints;

/** Porta de saída para o ledger de pontos ({@code point_events}). */
public interface PointEventRepositoryPort {

    PointEvent save(PointEvent event);

    /** Soma de pontos por usuário na janela [start, end). */
    List<UserPoints> sumByUser(UUID tenantId, Instant start, Instant end);

    /** Soma de pontos por dia e usuário na janela [start, end). */
    List<DayUserPoints> sumByDayAndUser(UUID tenantId, Instant start, Instant end);

    /** Soma de pontos por fonte e usuário na janela [start, end). */
    List<SourceUserPoints> sumBySourceAndUser(UUID tenantId, Instant start, Instant end);
}
