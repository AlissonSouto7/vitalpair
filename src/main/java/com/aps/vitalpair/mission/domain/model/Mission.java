package com.aps.vitalpair.mission.domain.model;

import lombok.Builder;
import lombok.Getter;

/** A mission of the catalogue. Immutable. */
@Getter
@Builder(toBuilder = true)
public class Mission {

    private final String code;
    private final String title;
    private final String description;
    private final int rewardPoints;
    private final MissionKind kind;
}
