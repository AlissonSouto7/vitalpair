package com.aps.vitalpair.mealvision.domain.model;

import java.math.BigDecimal;

/**
 * One food detected in a meal photo. Every value refers to the detected PORTION (that item's
 * totals, not per 100 g).
 */
public record DetectedFood(
        String foodName,
        BigDecimal quantityG,
        BigDecimal caloriesKcal,
        BigDecimal proteinG,
        BigDecimal carbG,
        BigDecimal fatG) {}
