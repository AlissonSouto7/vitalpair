package com.aps.vitalpair.season.application.dto;

import java.time.LocalDate;
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
    /**
     * Points by where they came from.
     *
     * <p>Carries the enum name and not a written label. The service used to send "Refeições" and
     * "Treinos" already in Portuguese, so the block stayed Portuguese with the interface in
     * English and changing language changed nothing. The client translates from {@code source}.
     */
    public record BreakdownRow(String source, int you, int rival) {}

    /** The summary of a season already closed. */
    /**
     * A finished season.
     *
     * <p>{@code lengthDays} and {@code endedOn} replace a pre-rendered "30 dias · fechou em
     * 14/08": the sentence was built here, in Portuguese, with a date formatted the Brazilian
     * way, and neither followed the reader's language. The client writes the line and formats
     * the date in its own locale.
     */
    public record HistoryRow(
            int number, int lengthDays, LocalDate endedOn, int you, int rival, String winner, String stake) {}
}
