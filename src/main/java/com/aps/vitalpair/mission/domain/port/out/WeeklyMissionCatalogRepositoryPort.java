package com.aps.vitalpair.mission.domain.port.out;

import java.util.List;

import com.aps.vitalpair.mission.domain.model.WeeklyMission;

/** Porta de saída para o catálogo de missões semanais. */
public interface WeeklyMissionCatalogRepositoryPort {

    /** Todas as missões do catálogo ordenadas por {@code display_order}. */
    List<WeeklyMission> findAllOrdered();
}
