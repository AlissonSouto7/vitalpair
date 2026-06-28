package com.aps.vitalpair.nutrition.infrastructure.web;

import com.aps.vitalpair.nutrition.domain.model.FavoriteFood;
import java.math.BigDecimal;

public record FavoriteFoodResponse(
        String foodName,
        BigDecimal quantityG,
        BigDecimal caloriesKcal,
        BigDecimal proteinG,
        BigDecimal carbG,
        BigDecimal fatG,
        long count) {

    public static FavoriteFoodResponse from(FavoriteFood favorite) {
        return new FavoriteFoodResponse(
                favorite.foodName(),
                favorite.quantityG(),
                favorite.caloriesKcal(),
                favorite.proteinG(),
                favorite.carbG(),
                favorite.fatG(),
                favorite.count());
    }
}
