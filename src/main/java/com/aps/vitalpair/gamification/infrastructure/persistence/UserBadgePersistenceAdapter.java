package com.aps.vitalpair.gamification.infrastructure.persistence;

import com.aps.vitalpair.gamification.domain.model.UserBadge;
import com.aps.vitalpair.gamification.domain.port.out.UserBadgeRepositoryPort;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Component;

@Component
public class UserBadgePersistenceAdapter implements UserBadgeRepositoryPort {

    private final UserBadgeJpaRepository repository;
    private final UserBadgePersistenceMapper mapper;

    public UserBadgePersistenceAdapter(UserBadgeJpaRepository repository, UserBadgePersistenceMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    @Override
    public UserBadge save(UserBadge userBadge) {
        return mapper.toDomain(repository.save(mapper.toEntity(userBadge)));
    }

    @Override
    public boolean existsByUserAndBadge(UUID userId, UUID badgeId) {
        return repository.existsByUserIdAndBadgeId(userId, badgeId);
    }

    @Override
    public List<UserBadge> findByUser(UUID userId) {
        return repository.findByUserId(userId).stream().map(mapper::toDomain).toList();
    }
}
