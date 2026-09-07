package com.aps.vitalpair.notification.domain.model;

import java.util.UUID;

import lombok.Builder;
import lombok.Getter;

/**
 * A user's notification preferences. Immutable. When no row is stored,
 * {@link #defaultsFor(UUID)} applies: rival and flash on, reminder off.
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
