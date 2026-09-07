package com.aps.vitalpair.pair.domain.model;

import java.time.Instant;
import java.util.UUID;

import lombok.Builder;
import lombok.Getter;

/**
 * Domain model of the pair, which is the system's <i>tenant</i> ({@code id} is the
 * {@code tenant_id}). Immutable: changes produce a new instance through {@link #toBuilder()}.
 */
@Getter
@Builder(toBuilder = true)
public class Pair {

    private final UUID id;
    private final UUID user1Id;
    private final UUID user2Id;
    private final String pairName;
    private final String inviteCode;
    private final PairStatus status;
    private final RelationshipType relationshipType;
    private final Instant createdAt;
}
