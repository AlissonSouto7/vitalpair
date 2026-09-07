package com.aps.vitalpair.notification.domain.port.in;

import java.util.UUID;

import com.aps.vitalpair.notification.domain.model.NotificationPreferences;

public interface GetNotificationPreferencesUseCase {

    /** The user's preferences, or the defaults when they never saved any. */
    NotificationPreferences getPreferences(UUID userId);
}
