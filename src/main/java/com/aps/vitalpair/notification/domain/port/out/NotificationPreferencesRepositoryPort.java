package com.aps.vitalpair.notification.domain.port.out;

import java.util.Optional;
import java.util.UUID;

import com.aps.vitalpair.notification.domain.model.NotificationPreferences;

/** Outbound port for persisting notification preferences. */
public interface NotificationPreferencesRepositoryPort {

    Optional<NotificationPreferences> findByUserId(UUID userId);

    NotificationPreferences save(NotificationPreferences preferences);
}
