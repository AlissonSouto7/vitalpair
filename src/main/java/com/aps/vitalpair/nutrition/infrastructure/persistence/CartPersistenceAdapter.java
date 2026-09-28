package com.aps.vitalpair.nutrition.infrastructure.persistence;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Component;

import com.aps.vitalpair.nutrition.domain.model.CartItem;
import com.aps.vitalpair.nutrition.domain.port.out.CartRepositoryPort;

/** O carrinho em Postgres. Ver {@link CartRepositoryPort}. */
@Component
public class CartPersistenceAdapter implements CartRepositoryPort {

    private final CartItemJpaRepository repository;
    private final CartItemPersistenceMapper mapper;

    public CartPersistenceAdapter(CartItemJpaRepository repository, CartItemPersistenceMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    @Override
    public CartItem save(CartItem item) {
        return mapper.toDomain(repository.save(mapper.toEntity(item)));
    }

    @Override
    public List<CartItem> findByOwnerAndDay(UUID userId, LocalDate day) {
        return repository.findByUserIdAndConsumedOnOrderByCreatedAtAsc(userId, day).stream()
                .map(mapper::toDomain)
                .toList();
    }

    @Override
    public List<CartItem> findForCheckout(UUID userId, LocalDate day) {
        return repository.findForCheckout(userId, day).stream()
                .map(mapper::toDomain)
                .toList();
    }

    @Override
    public boolean deleteOwned(UUID userId, UUID itemId) {
        // O dono entra na cláusula do delete, então não existe janela entre checar e apagar.
        return repository.deleteByIdAndUserId(itemId, userId) > 0;
    }

    @Override
    public int clear(UUID userId, LocalDate day) {
        return repository.deleteByUserIdAndConsumedOn(userId, day);
    }

    @Override
    public int deleteExpired(Instant now) {
        return repository.deleteExpired(now);
    }
}
