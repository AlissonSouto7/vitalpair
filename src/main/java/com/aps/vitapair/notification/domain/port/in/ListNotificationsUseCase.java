package com.aps.vitapair.notification.domain.port.in;

import com.aps.vitapair.notification.application.dto.NotificationFeed;
import java.util.UUID;

public interface ListNotificationsUseCase {

    NotificationFeed list(UUID userId);
}
