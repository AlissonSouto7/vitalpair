package com.aps.vitalpair.nutrition.domain.model;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import lombok.Builder;
import lombok.Getter;

/**
 * Um alimento no carrinho: uma refeição que ainda não foi confirmada.
 *
 * <p>Carrega os mesmos campos de {@link FoodLog} de propósito. Confirmar o carrinho é copiar
 * cada item para o diário sem traduzir nada, e uma forma diferente aqui viraria um mapeamento
 * a mais para alguém errar.
 *
 * <p>{@code consumedOn} é uma data, não um instante: "ontem" é uma pergunta sobre o calendário
 * de quem registra, e quem sabe responder é a aplicação, que conhece o fuso do perfil.
 */
@Getter
@Builder(toBuilder = true)
public class CartItem {

    private final UUID id;
    private final UUID tenantId;

    /** De quem é este item. O carrinho é de uma pessoa, não do par. */
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
    private final LocalDate consumedOn;
    private final Instant createdAt;

    /** Quando este item deixa de valer e pode ser apagado pela limpeza. */
    private final Instant expiresAt;
}
