package com.aps.vitalpair.season.domain.model;

import java.time.Instant;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

/** Uma linha do ledger de pontos. Espelha cada incremento do placar da competição. */
@Getter
@Builder(toBuilder = true)
public class PointEvent {

    private final UUID id;
    private final UUID tenantId;
    private final UUID userId;
    private final Instant occurredAt;
    private final PointSource source;
    private final int points;
}
