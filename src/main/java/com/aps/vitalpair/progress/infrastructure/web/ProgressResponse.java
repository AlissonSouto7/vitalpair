package com.aps.vitalpair.progress.infrastructure.web;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import com.aps.vitalpair.progress.domain.model.ProgressView;

/**
 * DTO de resposta da tela de Progresso. Contrato consumido pelo frontend.
 *
 * <p>Nem o dia nem o macro trazem rótulo. Os dois vinham escritos daqui em português (as
 * iniciais "S T Q Q S S D" e "Proteína"/"Carboidrato"/"Gordura"), o que colocava palavras em
 * português sob um gráfico nos outros três idiomas. A data e a chave são o fato; a tela
 * escreve o rótulo no idioma de quem lê, como já faz com o código de uma medalha.
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
                        .map(c -> new CalorieDayResponse(c.date(), c.kcal(), c.withinGoal()))
                        .toList(),
                view.macros().stream()
                        .map(m -> new MacroAverageResponse(m.key(), m.avgG(), m.targetG()))
                        .toList());
    }

    public record WeightPointResponse(LocalDate date, BigDecimal weightKg) {}

    public record CalorieDayResponse(LocalDate date, int kcal, boolean withinGoal) {}

    public record MacroAverageResponse(String key, int avgG, Integer targetG) {}
}
