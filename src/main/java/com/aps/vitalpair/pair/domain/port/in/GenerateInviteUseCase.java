package com.aps.vitalpair.pair.domain.port.in;

import com.aps.vitalpair.pair.application.dto.PairView;
import java.util.UUID;

public interface GenerateInviteUseCase {

    PairView generateInvite(UUID userId);
}
