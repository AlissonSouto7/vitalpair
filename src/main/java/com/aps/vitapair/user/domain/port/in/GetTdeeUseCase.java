package com.aps.vitapair.user.domain.port.in;

import com.aps.vitapair.tdee.domain.model.TdeeResult;
import java.util.UUID;

public interface GetTdeeUseCase {

    TdeeResult getTdee(UUID userId);
}
