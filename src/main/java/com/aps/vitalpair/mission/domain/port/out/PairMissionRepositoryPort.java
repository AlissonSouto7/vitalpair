package com.aps.vitalpair.mission.domain.port.out;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import com.aps.vitalpair.mission.domain.model.PairMissionState;

public interface PairMissionRepositoryPort {

    Optional<PairMissionState> find(UUID tenantId, LocalDate date);

    PairMissionState save(PairMissionState state);
}
