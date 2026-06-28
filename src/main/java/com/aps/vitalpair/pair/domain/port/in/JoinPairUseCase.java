package com.aps.vitalpair.pair.domain.port.in;

import com.aps.vitalpair.pair.application.dto.PairView;
import java.util.UUID;

public interface JoinPairUseCase {

    PairView joinPair(UUID userId, String inviteCode);
}
