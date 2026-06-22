package com.aps.vitapair.notification.domain.port.in;

import java.util.UUID;

public interface MarkNotificationsReadUseCase {

    void markAllRead(UUID userId);
}
