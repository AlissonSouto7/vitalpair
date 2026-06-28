package com.aps.vitalpair.progress.infrastructure.web;

import com.aps.vitalpair.progress.domain.model.ProgressView;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * DTO de resposta da tela de Progresso. Contrato consumido pelo frontend.
 */
public record ProgressResponse(
        List<WeightPointResponse> weights,
        Integer targetKcal,
        List<CalorieDayResponse> calories,
        List<MacroAverageResponse> macros) {

    public static ProgressResponse from(ProgressView view) {
        return new ProgressResponse(
                view.weights().stream()
                        .map(w -> new WeightPointResponse(w.date(), w.weightKg()))
                        .toList(),
                view.targetKcal(),
                view.calories().stream()
                        .map(c -> new CalorieDayResponse(c.date(), c.label(), c.kcal(), c.withinGoal()))
                        .toList(),
                view.macros().stream()
                        .map(m -> new MacroAverageResponse(m.key(), m.label(), m.avgG(), m.targetG()))
                        .toList());
    }

    public record WeightPointResponse(LocalDate date, BigDecimal weightKg) {
    }

    public record CalorieDayResponse(LocalDate date, String label, int kcal, boolean withinGoal) {
    }

    public record MacroAverageResponse(String key, String label, int avgG, Integer targetG) {
    }
}
