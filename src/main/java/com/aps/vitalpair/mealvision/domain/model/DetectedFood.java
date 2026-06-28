package com.aps.vitalpair.mealvision.domain.model;

import java.math.BigDecimal;

/**
 * Um alimento detectado numa foto de refeição. Todos os valores referem-se à PORÇÃO detectada
 * (totais daquele item, não por 100g).
 */
public record DetectedFood(
        String foodName,
        BigDecimal quantityG,
        BigDecimal caloriesKcal,
        BigDecimal proteinG,
        BigDecimal carbG,
        BigDecimal fatG) {
}
