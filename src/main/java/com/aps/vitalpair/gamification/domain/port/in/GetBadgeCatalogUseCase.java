package com.aps.vitalpair.gamification.domain.port.in;

import java.util.List;

import com.aps.vitalpair.gamification.domain.model.Badge;

public interface GetBadgeCatalogUseCase {

    List<Badge> getCatalog();
}
