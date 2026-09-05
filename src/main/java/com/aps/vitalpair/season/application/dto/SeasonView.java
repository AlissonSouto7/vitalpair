package com.aps.vitalpair.season.application.dto;

import java.util.List;

/**
 * Visão completa da temporada atual montada para o frontend. Mapeia 1:1 o contrato
 * de {@code GET /api/v1/season}. Pontos sempre somados do ledger ({@code point_events})
 * na janela da temporada ativa.
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

    /** Placar de um lado da disputa (você ou rival). */
    public record Side(String name, int score) {}

    /** Pontos de um dia decorrido da temporada. */
    public record DayScore(String label, int you, int rival) {}

    /** Pontos por fonte (Refeições, Treinos, Sequências, Missões). */
    public record BreakdownRow(String source, String label, int you, int rival) {}

    /** Resumo de uma temporada já fechada. */
    public record HistoryRow(int number, String sub, int you, int rival, String winner, String stake) {}
}
