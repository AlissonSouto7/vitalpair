package com.aps.vitapair.nutrition.domain.model;

import java.math.BigDecimal;

/** Produto retornado pela busca de alimentos (valores por 100g). */
public record FoodProduct(
        String name,
        String barcode,
        BigDecimal caloriesPer100g,
        BigDecimal proteinPer100g,
        BigDecimal carbPer100g,
        BigDecimal fatPer100g) {
}
