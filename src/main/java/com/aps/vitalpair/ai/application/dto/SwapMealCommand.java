package com.aps.vitalpair.ai.application.dto;

import com.aps.vitalpair.ai.domain.model.PlanMealType;

/** Pedido de troca de uma refeição do plano da semana atual (dia + tipo de refeição). */
public record SwapMealCommand(int dayIndex, PlanMealType mealType) {
}
