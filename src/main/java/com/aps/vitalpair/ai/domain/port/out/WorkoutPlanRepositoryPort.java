package com.aps.vitalpair.ai.domain.port.out;

import com.aps.vitalpair.ai.domain.model.WorkoutPlan;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

/** Porta de saída de persistência do plano de treino semanal. */
public interface WorkoutPlanRepositoryPort {

    Optional<WorkoutPlan> findByUserAndWeek(UUID userId, LocalDate weekStart);

    /** Salva o plano substituindo o plano existente do mesmo usuário/semana (dias e exercícios). */
    WorkoutPlan replace(WorkoutPlan plan);

    /** Plano completo dono do exercício informado (para checar posse antes de alterar). */
    Optional<WorkoutPlan> findByExerciseId(UUID exerciseId);

    void setExerciseDone(UUID exerciseId, boolean done);

    void setDayCompleted(UUID dayId, LocalDate completedOn);
}
