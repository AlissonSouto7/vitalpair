package com.aps.vitalpair.mealvision.infrastructure.web;

import java.math.BigDecimal;
import java.util.List;

import com.aps.vitalpair.mealvision.domain.model.MealPhotoAnalysis;

/** Resposta da análise de foto. Contrato consumido diretamente pelo frontend. */
public record PhotoAnalysisResponse(List<Item> items) {

    public record Item(
            String foodName,
            BigDecimal quantityG,
            BigDecimal caloriesKcal,
            BigDecimal proteinG,
            BigDecimal carbG,
            BigDecimal fatG) {}

    public static PhotoAnalysisResponse from(MealPhotoAnalysis analysis) {
        List<Item> items = analysis.items().stream()
                .map(food -> new Item(
                        food.foodName(),
                        food.quantityG(),
                        food.caloriesKcal(),
                        food.proteinG(),
                        food.carbG(),
                        food.fatG()))
                .toList();
        return new PhotoAnalysisResponse(items);
    }
}
