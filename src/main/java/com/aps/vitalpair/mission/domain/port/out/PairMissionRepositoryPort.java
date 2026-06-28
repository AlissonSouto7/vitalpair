package com.aps.vitalpair.mission.domain.port.out;

import com.aps.vitalpair.mission.domain.model.PairMissionState;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

public interface PairMissionRepositoryPort {

    Optional<PairMissionState> find(UUID tenantId, LocalDate date);

    PairMissionState save(PairMissionState state);
}
