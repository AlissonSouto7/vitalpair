package com.aps.vitapair.user.domain.port.out;

import com.aps.vitapair.user.domain.model.User;
import java.util.Optional;
import java.util.UUID;

/**
 * Porta de saída para persistência de usuários. Implementada por um adapter em
 * {@code infrastructure.persistence}. É a única forma de outras features acessarem usuários.
 */
public interface UserRepositoryPort {

    User save(User user);

    Optional<User> findById(UUID id);

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);
}
