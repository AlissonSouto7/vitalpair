package com.aps.vitalpair.shared.event;

import java.util.UUID;

/** Publicado quando um par é formado (convite aceito). Consumido pela gamificação. */
public record PairFormedEvent(UUID tenantId, UUID user1Id, UUID user2Id) {
}
