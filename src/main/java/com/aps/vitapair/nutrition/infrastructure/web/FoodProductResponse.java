package com.aps.vitapair.nutrition.infrastructure.web;

import com.aps.vitapair.nutrition.domain.model.FoodProduct;
import java.math.BigDecimal;

public record FoodProductResponse(
        String name,
        String barcode,
        BigDecimal caloriesPer100g,
        BigDecimal proteinPer100g,
        BigDecimal carbPer100g,
        BigDecimal fatPer100g) {

    public static FoodProductResponse from(FoodProduct product) {
        return new FoodProductResponse(
                product.name(),
                product.barcode(),
                product.caloriesPer100g(),
                product.proteinPer100g(),
                product.carbPer100g(),
                product.fatPer100g());
    }
}
