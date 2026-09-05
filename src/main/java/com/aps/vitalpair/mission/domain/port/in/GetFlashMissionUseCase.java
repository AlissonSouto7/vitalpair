package com.aps.vitalpair.mission.domain.port.in;

import java.util.UUID;

import com.aps.vitalpair.mission.domain.model.FlashMissionView;

public interface GetFlashMissionUseCase {

    /** Missão relâmpago do dia para o par ao qual o usuário pertence. */
    FlashMissionView getToday(UUID userId);
}
