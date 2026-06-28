package com.aps.vitalpair.user.domain.port.in;

import com.aps.vitalpair.tdee.domain.model.TdeeResult;
import java.util.UUID;

public interface GetTdeeUseCase {

    TdeeResult getTdee(UUID userId);
}
