package com.aps.vitalpair.notification.domain.port.out;

import java.util.List;
import java.util.UUID;

import com.aps.vitalpair.notification.domain.model.Notification;

public interface NotificationRepositoryPort {

    Notification save(Notification notification);

    List<Notification> findRecentByUser(UUID userId, int limit);

    long countUnread(UUID userId);

    void markAllRead(UUID userId);
}
