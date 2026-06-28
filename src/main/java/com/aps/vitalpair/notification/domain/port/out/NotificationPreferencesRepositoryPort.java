package com.aps.vitalpair.notification.domain.port.out;

import com.aps.vitalpair.notification.domain.model.NotificationPreferences;
import java.util.Optional;
import java.util.UUID;

/** Porta de saída para persistência das preferências de notificação. */
public interface NotificationPreferencesRepositoryPort {

    Optional<NotificationPreferences> findByUserId(UUID userId);

    NotificationPreferences save(NotificationPreferences preferences);
}
