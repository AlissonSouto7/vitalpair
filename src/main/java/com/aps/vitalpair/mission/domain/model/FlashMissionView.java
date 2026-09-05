package com.aps.vitalpair.mission.domain.model;

import java.time.Instant;
import java.time.LocalDate;

import lombok.Builder;
import lombok.Getter;

/** Visão da missão relâmpago do dia para o par, com o estado de aceitação. Imutável. */
@Getter
@Builder(toBuilder = true)
public class FlashMissionView {

    private final Mission mission;
    private final LocalDate date;
    private final boolean accepted;
    private final Instant expiresAt;
}
