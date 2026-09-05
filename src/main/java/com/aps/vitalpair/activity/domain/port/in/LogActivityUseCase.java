package com.aps.vitalpair.activity.domain.port.in;

import java.util.UUID;

import com.aps.vitalpair.activity.application.dto.LogActivityCommand;
import com.aps.vitalpair.activity.domain.model.ActivityLog;

public interface LogActivityUseCase {

    ActivityLog logActivity(UUID userId, LogActivityCommand command);
}
