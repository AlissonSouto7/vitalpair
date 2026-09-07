package com.aps.vitalpair.mission.domain.model;

import java.time.Instant;
import java.time.LocalDate;

import lombok.Builder;
import lombok.Getter;

/** Today's flash mission for the pair, with its acceptance state. Immutable. */
@Getter
@Builder(toBuilder = true)
public class FlashMissionView {

    private final Mission mission;
    private final LocalDate date;
    private final boolean accepted;
    private final Instant expiresAt;
}
