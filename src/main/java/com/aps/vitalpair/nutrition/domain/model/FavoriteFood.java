package com.aps.vitalpair.nutrition.domain.model;

import java.math.BigDecimal;

/**
 * One of a user's favourite foods: a {@code foodName} they log most, with representative
 * nutrition values (from the most recent entry) and how many times it was logged.
 */
public record FavoriteFood(
        String foodName,
        BigDecimal quantityG,
        BigDecimal caloriesKcal,
        BigDecimal proteinG,
        BigDecimal carbG,
        BigDecimal fatG,
        long count) {}
