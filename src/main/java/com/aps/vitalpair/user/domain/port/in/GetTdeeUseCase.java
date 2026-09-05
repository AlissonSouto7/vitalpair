package com.aps.vitalpair.user.domain.port.in;

import java.util.UUID;

import com.aps.vitalpair.tdee.domain.model.TdeeResult;

public interface GetTdeeUseCase {

    TdeeResult getTdee(UUID userId);
}
