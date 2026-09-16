package com.aps.vitalpair.mission.domain.port.in;

import java.util.UUID;

import com.aps.vitalpair.mission.domain.model.FlashMissionView;

public interface CancelFlashMissionUseCase {

    /**
     * Gives today's flash mission back, for a pair that had accepted it.
     *
     * Accepting was one-way: whoever tapped it by mistake, or changed their mind, carried a
     * mission they would not do until the day turned. Cancelling is the same record with the
     * flag cleared, so accepting again is possible on the same day.
     */
    FlashMissionView cancelToday(UUID userId);
}
