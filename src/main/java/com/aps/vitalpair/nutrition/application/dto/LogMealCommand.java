package com.aps.vitalpair.nutrition.application.dto;

import java.math.BigDecimal;
import java.time.Instant;

import com.aps.vitalpair.nutrition.domain.model.FoodSource;
import com.aps.vitalpair.nutrition.domain.model.MealType;

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
        boolean isPrivate,
        Instant loggedAt) {}
