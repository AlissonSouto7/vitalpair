package com.aps.vitalpair.notification.domain.port.in;

import java.util.UUID;

public interface MarkNotificationsReadUseCase {

    void markAllRead(UUID userId);
}
