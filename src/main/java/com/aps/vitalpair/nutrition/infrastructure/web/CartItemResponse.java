package com.aps.vitalpair.nutrition.infrastructure.web;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import com.aps.vitalpair.nutrition.domain.model.CartItem;
import com.aps.vitalpair.nutrition.domain.model.FoodSource;
import com.aps.vitalpair.nutrition.domain.model.MealType;

/**
 * Um item do carrinho, como a tela o recebe.
 *
 * <p>Sem {@code userId} e sem {@code tenantId}: quem pediu já sabe que o carrinho é seu, porque
 * não existe forma de pedir o de outra pessoa. Mandar o id do dono de volta seria devolver um
 * identificador interno que a tela não usa para nada.
 *
 * <p>{@code expiresAt} vai junto porque é informação da pessoa: um item montado anteontem some
 * sozinho, e a tela precisa poder avisar antes de ele sumir em silêncio.
 */
public record CartItemResponse(
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
        boolean isPrivate,
        LocalDate consumedOn,
        java.time.Instant expiresAt) {

    public static CartItemResponse from(CartItem item) {
        return new CartItemResponse(
                item.getId(),
                item.getFoodName(),
                item.getBarcode(),
                item.getQuantityG(),
                item.getCaloriesKcal(),
                item.getProteinG(),
                item.getCarbG(),
                item.getFatG(),
                item.getMealType(),
                item.getSource(),
                item.isPrivate(),
                item.getConsumedOn(),
                item.getExpiresAt());
    }
}
