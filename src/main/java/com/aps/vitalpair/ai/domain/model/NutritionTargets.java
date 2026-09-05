package com.aps.vitalpair.ai.domain.model;

import com.aps.vitalpair.user.domain.model.Goal;

/**
 * Metas nutricionais do usuário usadas para gerar o plano alimentar.
 * {@code dailyKcal} é obrigatório; os alvos de macros e o objetivo podem ser nulos
 * (entram no prompt só quando informados).
 */
public record NutritionTargets(int dailyKcal, Integer proteinG, Integer carbG, Integer fatG, Goal goal) {}
