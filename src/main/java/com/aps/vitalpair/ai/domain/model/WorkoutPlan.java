package com.aps.vitalpair.ai.domain.model;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import com.aps.vitalpair.user.domain.model.Goal;

/**
 * Plano de treino semanal gerado por IA. {@code weekStart} é sempre a segunda-feira da semana;
 * {@code days} cobre os 7 dias (dias sem treino ficam com {@code rest=true}).
 *
 * <p>{@code tenantId} acompanha o plano pelo mesmo motivo do {@link MealPlan}: a linha pertence
 * ao par, e toda leitura filtra por ele.
 */
public record WorkoutPlan(UUID id, UUID userId, UUID tenantId, LocalDate weekStart, Goal goal, List<WorkoutDay> days) {}
