package com.aps.vitapair.notification.domain.port.in;

import com.aps.vitapair.notification.domain.model.NotificationType;
import java.util.UUID;

public interface CreateNotificationUseCase {

    void create(UUID tenantId, UUID userId, NotificationType type, String title, String body);
}
