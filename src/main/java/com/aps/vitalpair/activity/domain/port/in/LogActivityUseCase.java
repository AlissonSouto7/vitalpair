package com.aps.vitalpair.activity.domain.port.in;

import com.aps.vitalpair.activity.application.dto.LogActivityCommand;
import com.aps.vitalpair.activity.domain.model.ActivityLog;
import java.util.UUID;

public interface LogActivityUseCase {

    ActivityLog logActivity(UUID userId, LogActivityCommand command);
}
