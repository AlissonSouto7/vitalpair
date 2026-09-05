package com.aps.vitalpair.nutrition.infrastructure.web;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import com.aps.vitalpair.nutrition.domain.model.FoodLog;
import com.aps.vitalpair.nutrition.domain.model.FoodSource;
import com.aps.vitalpair.nutrition.domain.model.MealType;

public record FoodLogResponse(
        UUID id,
        String foodName,
        String barcode,
        BigDecimal quantityG,
        BigDecimal caloriesKcal,
        BigDecimal proteinG,
        BigDecimal carbG,
        BigDecimal fatG,
        MealType mealType,
        FoodSource source,
        Instant loggedAt) {

    public static FoodLogResponse from(FoodLog log) {
        return new FoodLogResponse(
                log.getId(),
                log.getFoodName(),
                log.getBarcode(),
                log.getQuantityG(),
                log.getCaloriesKcal(),
                log.getProteinG(),
                log.getCarbG(),
                log.getFatG(),
                log.getMealType(),
                log.getSource(),
                log.getLoggedAt());
    }
}
