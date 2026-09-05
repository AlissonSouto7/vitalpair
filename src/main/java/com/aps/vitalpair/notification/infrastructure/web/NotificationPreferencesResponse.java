package com.aps.vitalpair.notification.infrastructure.web;

import com.aps.vitalpair.notification.domain.model.NotificationPreferences;

public record NotificationPreferencesResponse(boolean notifyRival, boolean notifyFlash, boolean notifyReminder) {

    public static NotificationPreferencesResponse from(NotificationPreferences prefs) {
        return new NotificationPreferencesResponse(
                prefs.isNotifyRival(), prefs.isNotifyFlash(), prefs.isNotifyReminder());
    }
}
