package com.aps.vitapair.notification.application.dto;

import com.aps.vitapair.notification.domain.model.NotificationType;
import java.time.Instant;
import java.util.UUID;

public record NotificationView(
        UUID id,
        NotificationType type,
        String actorName,
        String refText,
        Integer amount,
        boolean read,
        Instant createdAt) {
}
