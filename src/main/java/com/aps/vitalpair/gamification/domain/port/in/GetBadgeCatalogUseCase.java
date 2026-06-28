package com.aps.vitalpair.gamification.domain.port.in;

import com.aps.vitalpair.gamification.domain.model.Badge;
import java.util.List;

public interface GetBadgeCatalogUseCase {

    List<Badge> getCatalog();
}
