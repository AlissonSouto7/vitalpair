package com.aps.vitapair.gamification.domain.model;

import java.time.LocalDate;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

/** Placar semanal da competição do par. Imutável. */
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
