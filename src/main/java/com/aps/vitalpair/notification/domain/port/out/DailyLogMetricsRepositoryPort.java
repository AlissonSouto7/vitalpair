package com.aps.vitalpair.notification.domain.port.out;

import java.time.Instant;
import java.util.UUID;

/** Contagens read-only de registros do usuário num intervalo, para o lembrete de fim de dia. */
public interface DailyLogMetricsRepositoryPort {

    long countFoodLogs(UUID userId, Instant start, Instant end);

    long countActivityLogs(UUID userId, Instant start, Instant end);
}
