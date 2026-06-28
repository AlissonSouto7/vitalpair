package com.aps.vitalpair.season.domain.port.out.projection;

import java.time.LocalDate;
import java.util.UUID;

/** Pontos de um usuário em um dia específico. */
public record DayUserPoints(LocalDate day, UUID userId, long points) {
}
