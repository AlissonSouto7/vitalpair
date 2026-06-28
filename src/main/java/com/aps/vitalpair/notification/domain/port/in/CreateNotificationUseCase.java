package com.aps.vitalpair.notification.domain.port.in;

import com.aps.vitalpair.notification.domain.model.NotificationType;
import java.util.UUID;

public interface CreateNotificationUseCase {

    void create(UUID tenantId, UUID userId, NotificationType type, String actorName, String refText, Integer amount);
}
