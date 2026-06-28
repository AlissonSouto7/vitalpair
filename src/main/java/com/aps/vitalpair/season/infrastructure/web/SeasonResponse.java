package com.aps.vitalpair.season.infrastructure.web;

import com.aps.vitalpair.season.application.dto.SeasonView;
import java.util.List;

/**
 * Resposta de {@code GET /api/v1/season}. Os nomes dos campos são o contrato exato
 * consumido pelo frontend; não renomear sem alinhar com o front.
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

    public record Side(String name, int score) {
    }

    public record DayScore(String label, int you, int rival) {
    }

    public record BreakdownRow(String source, String label, int you, int rival) {
    }

    public record HistoryRow(int number, String sub, int you, int rival, String winner) {
    }

    public static SeasonResponse from(SeasonView v) {
        Side you = new Side(v.you().name(), v.you().score());
        Side rival = v.rival() == null ? null : new Side(v.rival().name(), v.rival().score());
        List<DayScore> days = v.days().stream()
                .map(d -> new DayScore(d.label(), d.you(), d.rival()))
                .toList();
        List<BreakdownRow> breakdown = v.breakdown().stream()
                .map(b -> new BreakdownRow(b.source(), b.label(), b.you(), b.rival()))
                .toList();
        List<HistoryRow> history = v.history().stream()
                .map(h -> new HistoryRow(h.number(), h.sub(), h.you(), h.rival(), h.winner()))
                .toList();
        return new SeasonResponse(
                v.number(), v.day(), v.total(), v.daysLeft(), v.stake(),
                v.hasPartner(), you, rival, days, breakdown, history);
    }
}
