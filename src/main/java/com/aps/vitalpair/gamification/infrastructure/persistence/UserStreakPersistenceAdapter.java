package com.aps.vitalpair.gamification.infrastructure.persistence;

import com.aps.vitalpair.gamification.domain.model.StreakType;
import com.aps.vitalpair.gamification.domain.model.UserStreak;
import com.aps.vitalpair.gamification.domain.port.out.UserStreakRepositoryPort;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Component;

@Component
public class UserStreakPersistenceAdapter implements UserStreakRepositoryPort {

    private final UserStreakJpaRepository repository;
    private final UserStreakPersistenceMapper mapper;

    public UserStreakPersistenceAdapter(UserStreakJpaRepository repository, UserStreakPersistenceMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    @Override
    public UserStreak save(UserStreak streak) {
        return mapper.toDomain(repository.save(mapper.toEntity(streak)));
    }

    @Override
    public Optional<UserStreak> findByUserAndType(UUID userId, StreakType type) {
        return repository.findByUserIdAndType(userId, type).map(mapper::toDomain);
    }

    @Override
    public List<UserStreak> findByUser(UUID userId) {
        return repository.findByUserId(userId).stream().map(mapper::toDomain).toList();
    }
}
