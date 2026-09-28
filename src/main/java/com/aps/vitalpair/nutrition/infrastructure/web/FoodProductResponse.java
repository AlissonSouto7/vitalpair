package com.aps.vitalpair.nutrition.infrastructure.web;

import java.math.BigDecimal;

import com.aps.vitalpair.nutrition.domain.model.FoodCategory;
import com.aps.vitalpair.nutrition.domain.model.FoodProduct;

/**
 * Um alimento como a tela o recebe.
 *
 * @param category a família, para a lista mostrar um ícone e uma palavra por linha em vez de
 *     oito nomes parecidos. {@code OTHER} para produto de marca, que é o que vem da Open Food
 *     Facts
 */
public record FoodProductResponse(
        String name,
        String barcode,
        BigDecimal caloriesPer100g,
        BigDecimal proteinPer100g,
        BigDecimal carbPer100g,
        BigDecimal fatPer100g,
        FoodCategory category) {

    public static FoodProductResponse from(FoodProduct product) {
        return new FoodProductResponse(
                product.name(),
                product.barcode(),
                product.caloriesPer100g(),
                product.proteinPer100g(),
                product.carbPer100g(),
                product.fatPer100g(),
                product.category());
    }
}
