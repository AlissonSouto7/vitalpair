package com.aps.vitalpair.nutrition.domain.model;

import java.math.BigDecimal;

/**
 * Produto retornado pela busca de alimentos (valores por 100g).
 *
 * @param category a família do alimento, que a tela usa para mostrar um ícone e uma palavra por
 *     linha. Nunca nulo: o que não tem família conhecida é {@link FoodCategory#OTHER}, que é o
 *     caso de todo produto de marca vindo da Open Food Facts
 */
public record FoodProduct(
        String name,
        String barcode,
        BigDecimal caloriesPer100g,
        BigDecimal proteinPer100g,
        BigDecimal carbPer100g,
        BigDecimal fatPer100g,
        FoodCategory category) {}
