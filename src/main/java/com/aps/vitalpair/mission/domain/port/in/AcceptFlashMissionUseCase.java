package com.aps.vitalpair.mission.domain.port.in;

import com.aps.vitalpair.mission.domain.model.FlashMissionView;
import java.util.UUID;

public interface AcceptFlashMissionUseCase {

    /** Aceita a missão relâmpago de hoje para o par do usuário. */
    FlashMissionView acceptToday(UUID userId);
}
