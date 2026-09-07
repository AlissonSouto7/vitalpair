package com.aps.vitalpair.mission.domain.port.in;

import java.util.UUID;

import com.aps.vitalpair.mission.domain.model.FlashMissionView;

public interface GetFlashMissionUseCase {

    /** Today's flash mission for the pair the user belongs to. */
    FlashMissionView getToday(UUID userId);
}
