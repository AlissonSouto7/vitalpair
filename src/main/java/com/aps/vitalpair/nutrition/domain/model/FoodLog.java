package com.aps.vitalpair.nutrition.domain.model;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

/** Registro de uma refeição. Imutável. */
@Getter
@Builder(toBuilder = true)
public class FoodLog {

    private final UUID id;
    private final UUID tenantId;
    private final UUID userId;
    private final String foodName;
    private final String barcode;
    private final BigDecimal quantityG;
    private final BigDecimal caloriesKcal;
    private final BigDecimal proteinG;
    private final BigDecimal carbG;
    private final BigDecimal fatG;
    private final MealType mealType;
    private final FoodSource source;
    private final boolean isPrivate;
    private final Instant loggedAt;
}
