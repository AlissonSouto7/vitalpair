package com.aps.vitapair.pair.domain.port.in;

import com.aps.vitapair.pair.application.dto.PairView;
import java.util.UUID;

public interface GenerateInviteUseCase {

    PairView generateInvite(UUID userId);
}
