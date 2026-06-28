package com.aps.vitalpair.gamification.infrastructure.web;

import com.aps.vitalpair.gamification.domain.model.CompetitionScore;
import java.time.LocalDate;
import java.util.UUID;

public record CompetitionResponse(
        LocalDate weekStart,
        int user1Score,
        int user2Score,
        UUID winnerId) {

    public static CompetitionResponse from(CompetitionScore score) {
        return new CompetitionResponse(
                score.getWeekStart(), score.getUser1Score(), score.getUser2Score(), score.getWinnerId());
    }
}
