package com.aps.vitalpair.user.domain.port.out;

import com.aps.vitalpair.user.domain.model.User;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Porta de saída para persistência de usuários. Implementada por um adapter em
 * {@code infrastructure.persistence}. É a única forma de outras features acessarem usuários.
 */
public interface UserRepositoryPort {

    User save(User user);

    Optional<User> findById(UUID id);

    /** Todos os usuários. Usado pelos agendadores de notificação (poucos usuários na v1). */
    List<User> findAll();

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);
}
