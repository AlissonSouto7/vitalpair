package com.aps.vitalpair.mission.domain.port.in;

import com.aps.vitalpair.mission.domain.model.WeeklyMissionProgress;
import java.util.List;
import java.util.UUID;

/** Caso de uso: listar as missões da semana atual com progresso real do usuário. */
public interface GetWeeklyMissionsUseCase {

    List<WeeklyMissionProgress> getCurrentWeek(UUID userId);
}
