package com.aps.vitalpair.mission.domain.model;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import lombok.Builder;
import lombok.Getter;

/** A pair's mission state on one day. Immutable. */
@Getter
@Builder(toBuilder = true)
public class PairMissionState {

    private final UUID tenantId;
    private final String missionCode;
    private final LocalDate date;
    private final boolean accepted;
    private final Instant acceptedAt;
}
