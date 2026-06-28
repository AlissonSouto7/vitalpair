package com.aps.vitalpair.notification.domain.model;

import java.time.Instant;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

/** Notificação in-app de um usuário. Imutável. */
@Getter
@Builder(toBuilder = true)
public class Notification {

    private final UUID id;
    private final UUID tenantId;
    private final UUID userId;
    private final NotificationType type;
    private final String actorName;
    private final String refText;
    private final Integer amount;
    private final boolean read;
    private final Instant createdAt;
}
