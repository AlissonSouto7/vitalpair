package com.aps.vitalpair.mission.domain.port.in;

import java.util.List;
import java.util.UUID;

import com.aps.vitalpair.mission.domain.model.WeeklyMissionProgress;

/** Caso de uso: listar as missões da semana atual com progresso real do usuário. */
public interface GetWeeklyMissionsUseCase {

    List<WeeklyMissionProgress> getCurrentWeek(UUID userId);
}
