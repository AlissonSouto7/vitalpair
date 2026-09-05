package com.aps.vitalpair.pair.domain.port.in;

import java.util.UUID;

import com.aps.vitalpair.pair.application.dto.PairView;

public interface GenerateInviteUseCase {

    PairView generateInvite(UUID userId);
}
