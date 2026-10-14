package com.aps.vitalpair.gamification.application.dto;

import java.time.LocalDate;
import java.util.UUID;

import com.aps.vitalpair.gamification.domain.model.CompetitionScore;

/**
 * One week of the scoreboard, from the caller's side.
 *
 * <p>The stored row holds {@code user1Score} and {@code user2Score}, which are positions in
 * the pair and not people. The dashboard worked out which one it was by comparing the
 * caller's id with the first entry of the member list, so the two screens that read the
 * scoreboard each carried a copy of that reasoning, and both depended on the member list
 * keeping the same order as the stored pair. Deciding it here means the client reads "mine"
 * and "theirs" and cannot get it backwards.
 *
 * @param weekStart the Monday the week began
 * @param yours the caller's points that week
 * @param theirs the partner's points that week
 * @param outcome who won, from the caller's side
 */
public record WeekResult(LocalDate weekStart, int yours, int theirs, Outcome outcome) {

    /** Who won a week, said from the caller's side rather than as an id to compare. */
    public enum Outcome {
        WON,
        LOST,
        /** Equal points. Nobody wins a tie, which is deliberate: it is not a loss either. */
        TIED
    }

    /**
     * Reads a stored row from one person's side.
     *
     * @param score the stored week
     * @param user1Id the first member of the pair, which is the side {@code user1Score} counts
     * @param callerId whoever is asking
     */
    public static WeekResult of(CompetitionScore score, UUID user1Id, UUID callerId) {
        boolean callerIsUser1 = callerId.equals(user1Id);
        int yours = callerIsUser1 ? score.getUser1Score() : score.getUser2Score();
        int theirs = callerIsUser1 ? score.getUser2Score() : score.getUser1Score();

        Outcome outcome;
        if (yours == theirs) {
            outcome = Outcome.TIED;
        } else if (yours > theirs) {
            outcome = Outcome.WON;
        } else {
            outcome = Outcome.LOST;
        }

        return new WeekResult(score.getWeekStart(), yours, theirs, outcome);
    }
}
