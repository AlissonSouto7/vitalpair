package com.aps.vitalpair.progress.domain.model;

import java.util.List;

/**
 * Visão completa da tela de Progresso: histórico de peso, calorias dos últimos
 * 7 dias e médias de macros dos últimos 7 dias.
 *
 * @param weights    pontos de peso em ordem cronológica (mais antigo → hoje)
 * @param targetKcal meta de calorias do usuário, ou {@code null} se sem meta
 * @param calories   um item por dia nos últimos 7 dias (6 dias atrás → hoje)
 * @param macros     médias diárias de proteína, carboidrato e gordura
 */
public record ProgressView(
        List<WeightPoint> weights,
        Integer targetKcal,
        List<CalorieDay> calories,
        List<MacroAverage> macros) {
}
