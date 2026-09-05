package com.aps.vitalpair.notification.domain.port.in;

import java.util.UUID;

import com.aps.vitalpair.notification.domain.model.NotificationPreferences;

public interface GetNotificationPreferencesUseCase {

    /** Devolve as prefs do usuário, ou os defaults se ele nunca salvou. */
    NotificationPreferences getPreferences(UUID userId);
}
