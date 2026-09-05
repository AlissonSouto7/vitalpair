package com.aps.vitalpair.notification.domain.model;

import java.util.UUID;

import lombok.Builder;
import lombok.Getter;

/**
 * Preferências de notificação de um usuário. Imutável. Quando não há linha
 * persistida usa-se {@link #defaultsFor(UUID)} (rival e flash ligados, lembrete desligado).
 */
@Getter
@Builder(toBuilder = true)
public class NotificationPreferences {

    private final UUID userId;
    private final boolean notifyRival;
    private final boolean notifyFlash;
    private final boolean notifyReminder;

    public static NotificationPreferences defaultsFor(UUID userId) {
        return NotificationPreferences.builder()
                .userId(userId)
                .notifyRival(true)
                .notifyFlash(true)
                .notifyReminder(false)
                .build();
    }
}
