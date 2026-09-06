package com.aps.vitalpair.ai.domain.port.out;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import com.aps.vitalpair.ai.domain.model.WorkoutPlan;

/**
 * Porta de saída de persistência do plano de treino semanal.
 *
 * <p>Como no plano alimentar, o tenant entra em toda leitura: é o que garante que um id de
 * exercício vazado não sirva para nada fora do par dono.
 */
public interface WorkoutPlanRepositoryPort {

    Optional<WorkoutPlan> findByUserAndWeek(UUID userId, UUID tenantId, LocalDate weekStart);

    /** Salva o plano substituindo o plano existente do mesmo usuário/semana (dias e exercícios). */
    WorkoutPlan replace(WorkoutPlan plan);

    /** Plano completo dono do exercício informado (para checar posse antes de alterar). */
    Optional<WorkoutPlan> findByExerciseId(UUID exerciseId);

    void setExerciseDone(UUID exerciseId, boolean done);

    void setDayCompleted(UUID dayId, LocalDate completedOn);
}
