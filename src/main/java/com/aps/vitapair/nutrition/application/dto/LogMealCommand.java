package com.aps.vitapair.nutrition.application.dto;

import com.aps.vitapair.nutrition.domain.model.FoodSource;
import com.aps.vitapair.nutrition.domain.model.MealType;
import java.math.BigDecimal;
import java.time.Instant;

/** Dados para registrar uma refeição. {@code loggedAt} nulo usa o instante atual. */
public record LogMealCommand(
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
}
