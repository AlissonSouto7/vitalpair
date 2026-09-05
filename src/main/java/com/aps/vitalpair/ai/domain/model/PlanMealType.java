package com.aps.vitalpair.ai.domain.model;

/**
 * Refeição do plano alimentar. A ordem de declaração é a ordem de exibição do dia
 * (café da manhã → almoço → lanche → janta) e é usada para ordenar as respostas da API.
 */
public enum PlanMealType {
    BREAKFAST,
    LUNCH,
    SNACK,
    DINNER
}
