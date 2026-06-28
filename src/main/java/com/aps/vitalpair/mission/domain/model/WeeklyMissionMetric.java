package com.aps.vitalpair.mission.domain.model;

/** Métrica que define como o progresso de uma missão semanal é contado. */
public enum WeeklyMissionMetric {
    /** Dias distintos em que o usuário registrou ao menos 1 refeição. */
    MEAL_DAYS,
    /** Atividades do usuário cujo tipo não seja STEPS. */
    WORKOUTS
}
