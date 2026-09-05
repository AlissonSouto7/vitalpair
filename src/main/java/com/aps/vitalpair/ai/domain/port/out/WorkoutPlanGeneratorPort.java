package com.aps.vitalpair.ai.domain.port.out;

import java.util.List;

import com.aps.vitalpair.ai.domain.model.WorkoutDay;
import com.aps.vitalpair.user.domain.model.ActivityLevel;
import com.aps.vitalpair.user.domain.model.Goal;

/** Porta de saída para a IA que monta o plano de treino (implementada sobre a Anthropic). */
public interface WorkoutPlanGeneratorPort {

    /** Gera os 7 dias da semana (4-5 dias de treino, o resto descanso) para o objetivo do usuário. */
    List<WorkoutDay> generateWeek(Goal goal, ActivityLevel activityLevel);
}
