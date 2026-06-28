package com.aps.vitalpair.mission.domain.port.in;

import com.aps.vitalpair.mission.domain.model.FlashMissionView;
import java.util.UUID;

public interface GetFlashMissionUseCase {

    /** Missão relâmpago do dia para o par ao qual o usuário pertence. */
    FlashMissionView getToday(UUID userId);
}
