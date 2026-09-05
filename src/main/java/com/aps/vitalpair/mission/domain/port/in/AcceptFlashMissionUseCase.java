package com.aps.vitalpair.mission.domain.port.in;

import java.util.UUID;

import com.aps.vitalpair.mission.domain.model.FlashMissionView;

public interface AcceptFlashMissionUseCase {

    /** Aceita a missão relâmpago de hoje para o par do usuário. */
    FlashMissionView acceptToday(UUID userId);
}
