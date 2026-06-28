package com.aps.vitalpair.mission.domain.model;

/** Define se a missão semanal é individual ou de dupla. */
public enum WeeklyMissionScope {
    /** Conta apenas o progresso do próprio usuário. */
    SELF,
    /** Exige que os dois membros do par cumpram a meta. */
    PAIR
}
