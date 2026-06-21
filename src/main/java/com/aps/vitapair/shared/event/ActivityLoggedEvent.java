package com.aps.vitapair.shared.event;

import java.time.LocalDate;
import java.util.UUID;

/** Publicado quando uma atividade física é registrada. Consumido pela gamificação. */
public record ActivityLoggedEvent(UUID userId, UUID tenantId, LocalDate date) {
}
