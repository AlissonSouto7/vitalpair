package com.aps.vitalpair.season.infrastructure.web;

import java.time.LocalDate;
import java.util.List;

import com.aps.vitalpair.season.application.dto.SeasonView;

/**
 * The response of {@code GET /api/v1/season}. The field names are the exact contract the
 * frontend consumes; do not rename them without changing the frontend too.
 */
public record SeasonResponse(
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

    public record Side(String name, int score) {}

    public record DayScore(String label, int you, int rival) {}

    /** Points by source. The client writes the label from {@code source}, in its own language. */
    public record BreakdownRow(String source, int you, int rival) {}

    /** A finished season. The client writes the summary line and formats the date. */
    public record HistoryRow(
            int number, int lengthDays, LocalDate endedOn, int you, int rival, String winner, String stake) {}

    public static SeasonResponse from(SeasonView v) {
        Side you = new Side(v.you().name(), v.you().score());
        Side rival =
                v.rival() == null ? null : new Side(v.rival().name(), v.rival().score());
        List<DayScore> days = v.days().stream()
                .map(d -> new DayScore(d.label(), d.you(), d.rival()))
                .toList();
        List<BreakdownRow> breakdown = v.breakdown().stream()
                .map(b -> new BreakdownRow(b.source(), b.you(), b.rival()))
                .toList();
        List<HistoryRow> history = v.history().stream()
                .map(h -> new HistoryRow(
                        h.number(), h.lengthDays(), h.endedOn(), h.you(), h.rival(), h.winner(), h.stake()))
                .toList();
        return new SeasonResponse(
                v.number(),
                v.day(),
                v.total(),
                v.daysLeft(),
                v.stake(),
                v.hasPartner(),
                you,
                rival,
                days,
                breakdown,
                history);
    }
}
