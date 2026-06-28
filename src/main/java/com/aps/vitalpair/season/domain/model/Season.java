package com.aps.vitalpair.season.domain.model;

import java.time.LocalDate;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

/** Temporada de 30 dias do par (tenant). Imutável: alterações via {@link #toBuilder()}. */
@Getter
@Builder(toBuilder = true)
public class Season {

    private final UUID id;
    private final UUID tenantId;
    private final int number;
    private final LocalDate startDate;
    private final LocalDate endDate;
    private final String stake;
    private final SeasonStatus status;
    private final UUID winnerUserId;
}
