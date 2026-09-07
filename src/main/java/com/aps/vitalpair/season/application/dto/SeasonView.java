package com.aps.vitalpair.season.application.dto;

import java.util.List;

/**
 * The whole current season, built for the frontend. Maps one to one onto the contract of
 * {@code GET /api/v1/season}. Points are always summed from the ledger ({@code point_events})
 * over the active season's window.
 */
public record SeasonView(
        int number,
        int day,
        int total,
        int daysLeft,
        String stake,
        boolean hasPartner,
        Side you,
        Side rival,
        List<DayScore> days,
        List<BreakdownRow> breakdown,
        List<HistoryRow> history) {

    /** One side of the contest (you or the rival). */
    public record Side(String name, int score) {}

    /** Pontos de um dia decorrido da temporada. */
    public record DayScore(String label, int you, int rival) {}

    /** Points per source (meals, workouts, streaks, missions). */
    public record BreakdownRow(String source, String label, int you, int rival) {}

    /** The summary of a season already closed. */
    public record HistoryRow(int number, String sub, int you, int rival, String winner, String stake) {}
}
