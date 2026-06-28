package com.aps.vitalpair.nutrition.infrastructure.web;

import com.aps.vitalpair.nutrition.domain.model.FoodSource;
import com.aps.vitalpair.nutrition.domain.model.MealType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.Instant;

public record LogMealRequest(
        @NotBlank @Size(max = 255) String foodName,
        @Size(max = 50) String barcode,
        @NotNull @PositiveOrZero BigDecimal quantityG,
        @NotNull @PositiveOrZero BigDecimal caloriesKcal,
        @PositiveOrZero BigDecimal proteinG,
        @PositiveOrZero BigDecimal carbG,
        @PositiveOrZero BigDecimal fatG,
        @NotNull MealType mealType,
        @NotNull FoodSource source,
        boolean isPrivate,
        Instant loggedAt) {
}
