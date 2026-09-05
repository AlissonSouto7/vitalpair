package com.aps.vitalpair.ai.application.dto;

import com.aps.vitalpair.ai.domain.model.MealPlan;

/**
 * Plano alimentar pronto para exibição: o plano da semana mais a meta diária de kcal
 * do usuário (nula se o perfil ainda não tem meta).
 */
public record MealPlanView(MealPlan plan, Integer targetKcal) {
}
