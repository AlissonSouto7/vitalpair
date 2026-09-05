package com.aps.vitalpair.notification.domain.port.in;

import java.util.UUID;

import com.aps.vitalpair.notification.domain.model.NotificationType;

public interface CreateNotificationUseCase {

    void create(UUID tenantId, UUID userId, NotificationType type, String actorName, String refText, Integer amount);
}
