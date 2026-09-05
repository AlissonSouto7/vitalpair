package com.aps.vitalpair.pair.domain.model;

import java.time.Instant;
import java.util.UUID;

import lombok.Builder;
import lombok.Getter;

/**
 * Modelo de domínio do par, que é o <i>tenant</i> do sistema ({@code id} = {@code tenant_id}).
 * Imutável: alterações geram nova instância via {@link #toBuilder()}.
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
