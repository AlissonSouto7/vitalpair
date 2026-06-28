package com.aps.vitalpair.nutrition.domain.model;

import java.math.BigDecimal;

/**
 * Alimento favorito de um usuário: um {@code foodName} que ele mais registra,
 * com valores nutricionais representativos (do registro mais recente) e a
 * quantidade de vezes que foi registrado.
 */
public record FavoriteFood(
        String foodName,
        BigDecimal quantityG,
        BigDecimal caloriesKcal,
        BigDecimal proteinG,
        BigDecimal carbG,
        BigDecimal fatG,
        long count) {
}
