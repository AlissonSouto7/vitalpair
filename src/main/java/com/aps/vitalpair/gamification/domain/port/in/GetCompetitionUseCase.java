package com.aps.vitalpair.gamification.domain.port.in;

import java.util.UUID;

import com.aps.vitalpair.gamification.domain.model.CompetitionScore;

public interface GetCompetitionUseCase {

    /** The current week's scoreboard of the pair the user belongs to. */
    CompetitionScore getCurrentCompetition(UUID userId);
}
