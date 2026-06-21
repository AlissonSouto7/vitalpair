package com.aps.vitapair.gamification.domain.port.in;

import com.aps.vitapair.gamification.domain.model.Badge;
import java.util.List;

public interface GetBadgeCatalogUseCase {

    List<Badge> getCatalog();
}
