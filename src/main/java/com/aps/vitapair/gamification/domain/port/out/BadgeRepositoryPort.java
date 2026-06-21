package com.aps.vitapair.gamification.domain.port.out;

import com.aps.vitapair.gamification.domain.model.Badge;
import java.util.List;
import java.util.Optional;

public interface BadgeRepositoryPort {

    Optional<Badge> findByCode(String code);

    List<Badge> findAll();
}
