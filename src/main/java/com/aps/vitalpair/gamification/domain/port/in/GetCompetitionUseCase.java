package com.aps.vitalpair.gamification.domain.port.in;

import java.util.List;
import java.util.UUID;

import com.aps.vitalpair.gamification.application.dto.WeekResult;
import com.aps.vitalpair.gamification.domain.model.CompetitionScore;

public interface GetCompetitionUseCase {

    /** The current week's scoreboard of the pair the user belongs to. */
    CompetitionScore getCurrentCompetition(UUID userId);

    /**
     * The weeks already closed, most recent first, from the caller's own side.
     *
     * <p>A row per week has been written since this feature shipped and only the current week
     * was ever read: every closed week was saved and then thrown away. Returned as {@link
     * WeekResult} rather than as the stored row so the client does not have to work out which
     * of the two stored sides is its own.
     */
    List<WeekResult> getHistory(UUID userId, int limit);
}
