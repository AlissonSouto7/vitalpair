package com.aps.vitalpair.notification.application.dto;

import java.time.Instant;
import java.util.UUID;

import com.aps.vitalpair.notification.domain.model.NotificationType;

public record NotificationView(
        UUID id,
        NotificationType type,
        String actorName,
        String refText,
        Integer amount,
        boolean read,
        Instant createdAt) {}
