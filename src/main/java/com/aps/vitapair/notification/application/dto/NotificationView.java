package com.aps.vitapair.notification.application.dto;

import com.aps.vitapair.notification.domain.model.NotificationType;
import java.time.Instant;
import java.util.UUID;

public record NotificationView(
        UUID id,
        NotificationType type,
        String title,
        String body,
        boolean read,
        Instant createdAt) {
}
