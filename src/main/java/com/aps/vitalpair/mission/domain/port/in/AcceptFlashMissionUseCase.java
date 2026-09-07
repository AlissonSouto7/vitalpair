package com.aps.vitalpair.mission.domain.port.in;

import java.util.UUID;

import com.aps.vitalpair.mission.domain.model.FlashMissionView;

public interface AcceptFlashMissionUseCase {

    /** Accepts today's flash mission for the user's pair. */
    FlashMissionView acceptToday(UUID userId);
}
