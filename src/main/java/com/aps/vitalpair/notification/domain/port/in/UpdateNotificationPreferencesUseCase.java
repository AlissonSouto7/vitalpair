package com.aps.vitalpair.notification.domain.port.in;

import java.util.UUID;

import com.aps.vitalpair.notification.domain.model.NotificationPreferences;

public interface UpdateNotificationPreferencesUseCase {

    NotificationPreferences updatePreferences(
            UUID userId, boolean notifyRival, boolean notifyFlash, boolean notifyReminder);
}
