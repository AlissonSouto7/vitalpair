package com.aps.vitalpair.notification.domain.port.in;

import java.util.UUID;

import com.aps.vitalpair.notification.application.dto.NotificationFeed;

public interface ListNotificationsUseCase {

    NotificationFeed list(UUID userId);
}
