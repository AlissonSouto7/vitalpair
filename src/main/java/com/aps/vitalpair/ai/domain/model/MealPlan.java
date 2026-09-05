package com.aps.vitalpair.ai.domain.model;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Plano alimentar semanal gerado por IA. {@code weekStart} é sempre a segunda-feira da semana;
 * {@code items} cobre 7 dias x 4 refeições. Imutável; ids nulos indicam plano ainda não persistido.
 */
public record MealPlan(UUID id, UUID userId, LocalDate weekStart, Instant createdAt, List<MealPlanItem> items) {}
