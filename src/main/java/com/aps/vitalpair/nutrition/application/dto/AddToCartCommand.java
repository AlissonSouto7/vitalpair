package com.aps.vitalpair.nutrition.application.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.aps.vitalpair.nutrition.domain.model.FoodSource;
import com.aps.vitalpair.nutrition.domain.model.MealType;

/**
 * O que é preciso para pôr um alimento no carrinho.
 *
 * @param consumedOn o dia a que o item se refere. Nulo quer dizer hoje, na zona de quem
 *     registra: é o serviço que sabe o fuso do perfil, e deixar o cliente decidir "hoje" põe o
 *     relógio do aparelho no comando de uma data que o resto do produto calcula sozinho.
 */
public record AddToCartCommand(
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
        LocalDate consumedOn) {}
