package com.aps.vitapair.notification.domain.port.out;

import com.aps.vitapair.notification.domain.model.Notification;
import java.util.List;
import java.util.UUID;

public interface NotificationRepositoryPort {

    Notification save(Notification notification);

    List<Notification> findRecentByUser(UUID userId, int limit);

    long countUnread(UUID userId);

    void markAllRead(UUID userId);
}
