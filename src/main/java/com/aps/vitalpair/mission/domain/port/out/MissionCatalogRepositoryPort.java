package com.aps.vitalpair.mission.domain.port.out;

import java.util.List;
import java.util.Optional;

import com.aps.vitalpair.mission.domain.model.Mission;
import com.aps.vitalpair.mission.domain.model.MissionKind;

public interface MissionCatalogRepositoryPort {

    List<Mission> findByKind(MissionKind kind);

    Optional<Mission> findByCode(String code);
}
