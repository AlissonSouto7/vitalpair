package com.aps.vitapair.activity.domain.port.in;

import com.aps.vitapair.activity.application.dto.LogActivityCommand;
import com.aps.vitapair.activity.domain.model.ActivityLog;
import java.util.UUID;

public interface LogActivityUseCase {

    ActivityLog logActivity(UUID userId, LogActivityCommand command);
}
