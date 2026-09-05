package com.aps.vitalpair.gamification.domain.port.in;

import java.util.UUID;

import com.aps.vitalpair.gamification.domain.model.CompetitionScore;

public interface GetCompetitionUseCase {

    /** Placar da semana atual do par ao qual o usuário pertence. */
    CompetitionScore getCurrentCompetition(UUID userId);
}
