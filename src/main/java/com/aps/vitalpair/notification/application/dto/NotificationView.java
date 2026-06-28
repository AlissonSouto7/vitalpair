package com.aps.vitalpair.notification.application.dto;

import com.aps.vitalpair.notification.domain.model.NotificationType;
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
