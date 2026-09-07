package com.aps.vitalpair.shared.event;

import java.util.UUID;

/** Published when a pair is formed (an invite accepted). Consumed by gamification and notifications. */
public record PairFormedEvent(UUID tenantId, UUID user1Id, UUID user2Id) {}
