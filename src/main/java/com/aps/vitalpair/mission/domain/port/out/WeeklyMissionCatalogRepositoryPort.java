package com.aps.vitalpair.mission.domain.port.out;

import com.aps.vitalpair.mission.domain.model.WeeklyMission;
import java.util.List;

/** Porta de saída para o catálogo de missões semanais. */
public interface WeeklyMissionCatalogRepositoryPort {

    /** Todas as missões do catálogo ordenadas por {@code display_order}. */
    List<WeeklyMission> findAllOrdered();
}
