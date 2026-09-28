package com.aps.vitalpair.nutrition.infrastructure.persistence;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import jakarta.persistence.LockModeType;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * As consultas do carrinho.
 *
 * <p>Toda uma leva o dono. Não existe um {@code findById} exposto aqui de propósito: o
 * carrinho é privado até dentro do par, e um método que buscasse pelo id sozinho seria o
 * caminho para alguém esquecer o filtro num uso novo.
 */
public interface CartItemJpaRepository extends JpaRepository<CartItemJpaEntity, UUID> {

    List<CartItemJpaEntity> findByUserIdAndConsumedOnOrderByCreatedAtAsc(UUID userId, LocalDate consumedOn);

    /**
     * A mesma leitura, travando as linhas até o fim da transação.
     *
     * <p>Só a confirmação usa esta: ela lê o carrinho, grava cada item e esvazia. Sem a trava,
     * dois toques no botão ao mesmo tempo leem a mesma lista antes de qualquer um esvaziar, e o
     * almoço entra duas vezes no diário, com ponto dobrado. Com ela, a segunda transação espera,
     * encontra o carrinho já vazio e para na regra do carrinho vazio.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from CartItemJpaEntity c where c.userId = :userId and c.consumedOn = :day"
            + " order by c.createdAt asc")
    List<CartItemJpaEntity> findForCheckout(@Param("userId") UUID userId, @Param("day") LocalDate day);

    /** Apaga só se for do dono, o que faz a checagem e a remoção serem uma operação só. */
    @Modifying
    @Query("delete from CartItemJpaEntity c where c.id = :id and c.userId = :userId")
    int deleteByIdAndUserId(@Param("id") UUID id, @Param("userId") UUID userId);

    @Modifying
    @Query("delete from CartItemJpaEntity c where c.userId = :userId and c.consumedOn = :day")
    int deleteByUserIdAndConsumedOn(@Param("userId") UUID userId, @Param("day") LocalDate day);

    @Modifying
    @Query("delete from CartItemJpaEntity c where c.expiresAt < :now")
    int deleteExpired(@Param("now") Instant now);
}
