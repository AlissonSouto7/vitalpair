package com.aps.vitalpair.nutrition.domain.port.out;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import com.aps.vitalpair.nutrition.domain.model.CartItem;

/**
 * O carrinho, como ele é guardado.
 *
 * <p>Todo método leva o dono. Não existe "buscar item por id" sem dizer de quem: um carrinho é
 * privado até dentro do par, e uma assinatura que permitisse ler pelo id sozinho seria um
 * convite a esquecer o filtro em algum caminho novo.
 */
public interface CartRepositoryPort {

    CartItem save(CartItem item);

    /** Os itens de uma pessoa para um dia, os mais antigos primeiro. */
    List<CartItem> findByOwnerAndDay(UUID userId, LocalDate day);

    /**
     * A mesma lista, mas segurando as linhas até o fim da transação de quem chamou.
     *
     * <p>Existe separada porque é o que a confirmação precisa e o que mais nada precisa: dois
     * toques no botão ao mesmo tempo leriam o mesmo carrinho e gravariam o mesmo almoço duas
     * vezes, com ponto dobrado. Uma leitura de tela não pode pagar esse preço nem segurar
     * linha de ninguém.
     */
    List<CartItem> findForCheckout(UUID userId, LocalDate day);

    /**
     * Remove um item, se ele for de quem pediu.
     *
     * @return true quando removeu. False quando o item não existe ou é de outra pessoa, que
     *     para quem chama é a mesma coisa: não havia nada seu ali.
     */
    boolean deleteOwned(UUID userId, UUID itemId);

    /** Esvazia o carrinho de uma pessoa num dia. Devolve quantos saíram. */
    int clear(UUID userId, LocalDate day);

    /** Apaga o que passou da validade, em qualquer conta. Devolve quantos saíram. */
    int deleteExpired(Instant now);
}
