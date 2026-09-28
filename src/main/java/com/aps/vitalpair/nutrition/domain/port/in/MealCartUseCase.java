package com.aps.vitalpair.nutrition.domain.port.in;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import com.aps.vitalpair.nutrition.application.dto.AddToCartCommand;
import com.aps.vitalpair.nutrition.domain.model.CartItem;
import com.aps.vitalpair.nutrition.domain.model.FoodLog;

/**
 * Montar o prato antes de registrar.
 *
 * <p>Quem almoça arroz, feijão e bife passava três vezes pelo mesmo fluxo, e o diário mostrava
 * três linhas separadas de uma refeição só. O carrinho junta o prato e grava tudo de uma vez.
 *
 * <p>Toda operação recebe o dono, sempre quem está autenticado. Não há caminho que leia ou
 * mexa no carrinho de outra pessoa, nem dentro do par: o par divide o diário, não o prato que
 * ainda está sendo montado.
 */
public interface MealCartUseCase {

    /** Quantos itens cabem num carrinho, por dia. Ver {@code MealCartService} para o porquê. */
    int MAX_ITEMS_PER_DAY = 50;

    /** Põe um alimento no carrinho. */
    CartItem addToCart(UUID userId, AddToCartCommand command);

    /** O que está no carrinho de um dia. Vazio quando não há nada, nunca nulo. */
    List<CartItem> cartOf(UUID userId, LocalDate day);

    /** Tira um item. Um item que não é seu responde como um item que não existe. */
    void removeFromCart(UUID userId, UUID itemId);

    /** Esvazia o carrinho do dia. */
    void clearCart(UUID userId, LocalDate day);

    /**
     * Grava o carrinho no diário, e o esvazia.
     *
     * <p>Tudo ou nada: ou as refeições entram todas, ou nenhuma entra e o carrinho continua
     * como estava. Metade do almoço registrado é pior que nenhum, porque a pessoa não tem como
     * saber o que faltou sem conferir item por item.
     *
     * @return as refeições que passaram a existir
     */
    List<FoodLog> checkout(UUID userId, LocalDate day);
}
