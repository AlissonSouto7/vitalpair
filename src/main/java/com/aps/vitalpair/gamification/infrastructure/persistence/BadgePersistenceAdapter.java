package com.aps.vitalpair.gamification.infrastructure.persistence;

import com.aps.vitalpair.gamification.domain.model.Badge;
import com.aps.vitalpair.gamification.domain.port.out.BadgeRepositoryPort;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Component;

@Component
public class BadgePersistenceAdapter implements BadgeRepositoryPort {

    private final BadgeJpaRepository repository;
    private final BadgePersistenceMapper mapper;

    public BadgePersistenceAdapter(BadgeJpaRepository repository, BadgePersistenceMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    @Override
    public Optional<Badge> findByCode(String code) {
        return repository.findByCode(code).map(mapper::toDomain);
    }

    @Override
    public List<Badge> findAll() {
        return repository.findAll().stream().map(mapper::toDomain).toList();
    }
}
