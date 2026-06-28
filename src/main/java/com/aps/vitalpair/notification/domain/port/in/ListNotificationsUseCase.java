package com.aps.vitalpair.notification.domain.port.in;

import com.aps.vitalpair.notification.application.dto.NotificationFeed;
import java.util.UUID;

public interface ListNotificationsUseCase {

    NotificationFeed list(UUID userId);
}
