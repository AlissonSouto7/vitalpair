package com.aps.vitalpair.nutrition.infrastructure.web;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import com.aps.vitalpair.nutrition.domain.model.FoodSource;
import com.aps.vitalpair.nutrition.domain.model.MealType;
import com.aps.vitalpair.shared.time.NotInFutureDate;

/**
 * Um alimento a pôr no carrinho.
 *
 * <p>Os tetos existem porque estes números entram em somas que a tela mostra e o placar usa:
 * sem eles, um cliente pode mandar uma quantidade absurda e fazer o diário do par exibir um
 * número sem sentido. Os limites são generosos o bastante para nenhum prato real esbarrar.
 *
 * @param quantityG maior que zero: um alimento de zero grama não é um registro, é um engano
 * @param consumedOn nulo quer dizer hoje. Um dia no futuro é recusado pelo mesmo motivo que
 *     uma refeição com data futura já era: a sequência, o placar e a competição da semana são
 *     contados por data, e uma data à frente fabrica pontos que ninguém ganhou.
 */
public record AddToCartRequest(
        @NotBlank @Size(max = 255) String foodName,
        @Size(max = 50) String barcode,
        @NotNull @Positive @DecimalMax("10000.00") BigDecimal quantityG,
        @NotNull @PositiveOrZero @DecimalMax("20000.00") BigDecimal caloriesKcal,
        @PositiveOrZero @DecimalMax("5000.00") BigDecimal proteinG,
        @PositiveOrZero @DecimalMax("5000.00") BigDecimal carbG,
        @PositiveOrZero @DecimalMax("5000.00") BigDecimal fatG,
        @NotNull MealType mealType,
        @NotNull FoodSource source,
        boolean isPrivate,
        @NotInFutureDate LocalDate consumedOn) {}
