package com.aps.vitalpair.mission.domain.port.out;

import java.time.Instant;
import java.util.UUID;

/**
 * Porta de saída para as contagens (read-only) que alimentam o progresso das
 * missões semanais. Bate direto nas tabelas de logs, sempre filtrando por usuário
 * e período. Mantém a feature mission auto-contida.
 */
public interface WeeklyMissionMetricsRepositoryPort {

    /**
     * Número de dias distintos em que o usuário registrou ao menos uma refeição
     * no período {@code [start, end)}.
     */
    int countMealDays(UUID userId, Instant start, Instant end);

    /**
     * Número de atividades do usuário no período {@code [start, end)} cujo tipo
     * não seja STEPS.
     */
    int countWorkouts(UUID userId, Instant start, Instant end);
}
