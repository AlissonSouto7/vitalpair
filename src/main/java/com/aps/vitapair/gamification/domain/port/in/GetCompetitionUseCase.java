package com.aps.vitapair.gamification.domain.port.in;

import com.aps.vitapair.gamification.domain.model.CompetitionScore;
import java.util.UUID;

public interface GetCompetitionUseCase {

    /** Placar da semana atual do par ao qual o usuário pertence. */
    CompetitionScore getCurrentCompetition(UUID userId);
}
