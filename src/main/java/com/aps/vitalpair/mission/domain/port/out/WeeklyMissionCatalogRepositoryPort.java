package com.aps.vitalpair.mission.domain.port.out;

import java.util.List;

import com.aps.vitalpair.mission.domain.model.WeeklyMission;

/** Outbound port to the weekly mission catalogue. */
public interface WeeklyMissionCatalogRepositoryPort {

    /** Every mission of the catalogue, ordered by {@code display_order}. */
    List<WeeklyMission> findAllOrdered();
}
