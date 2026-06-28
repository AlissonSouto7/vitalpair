package com.aps.vitalpair.gamification.domain.port.out;

import com.aps.vitalpair.gamification.domain.model.Badge;
import java.util.List;
import java.util.Optional;

public interface BadgeRepositoryPort {

    Optional<Badge> findByCode(String code);

    List<Badge> findAll();
}
