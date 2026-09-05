package com.aps.vitalpair.gamification.domain.port.out;

import java.util.List;
import java.util.Optional;

import com.aps.vitalpair.gamification.domain.model.Badge;

public interface BadgeRepositoryPort {

    Optional<Badge> findByCode(String code);

    List<Badge> findAll();
}
