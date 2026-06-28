package com.aps.vitalpair.notification.domain.port.in;

import com.aps.vitalpair.notification.domain.model.NotificationPreferences;
import java.util.UUID;

public interface UpdateNotificationPreferencesUseCase {

    NotificationPreferences updatePreferences(
            UUID userId, boolean notifyRival, boolean notifyFlash, boolean notifyReminder);
}
