package com.aps.vitalpair.gamification.domain.model;

import java.time.LocalDate;
import java.util.UUID;

import lombok.Builder;
import lombok.Getter;

/** The pair's weekly scoreboard. Immutable. */
@Getter
@Builder(toBuilder = true)
public class CompetitionScore {

    private final UUID id;
    private final UUID tenantId;
    private final LocalDate weekStart;
    private final int user1Score;
    private final int user2Score;
    private final UUID winnerId;
}
