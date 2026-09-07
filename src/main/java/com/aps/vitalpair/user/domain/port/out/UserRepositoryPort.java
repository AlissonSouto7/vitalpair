package com.aps.vitalpair.user.domain.port.out;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.aps.vitalpair.user.domain.model.User;

/**
 * Outbound port for persisting users. Implemented by an adapter in
 * {@code infrastructure.persistence}. It is the only way other features reach users.
 */
public interface UserRepositoryPort {

    User save(User user);

    Optional<User> findById(UUID id);

    /** Every user. Used by the notification schedulers; unpaged, which is fine only while there are few users. */
    List<User> findAll();

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);
}
