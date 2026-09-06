package com.aps.vitalpair.ai.domain.model;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Plano alimentar semanal gerado por IA. {@code weekStart} é sempre a segunda-feira da semana;
 * {@code items} cobre 7 dias x 4 refeições. Imutável; ids nulos indicam plano ainda não persistido.
 *
 * <p>{@code tenantId} acompanha o plano porque toda linha de dado de usuário é escopada pelo par
 * dono: sem ele a coluna NOT NULL da V22 não tem como ser preenchida e a leitura não teria como
 * ser filtrada pelo tenant.
 */
public record MealPlan(
        UUID id, UUID userId, UUID tenantId, LocalDate weekStart, Instant createdAt, List<MealPlanItem> items) {}
