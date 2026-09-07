package com.aps.vitalpair.pair.application.dto;

import java.util.List;
import java.util.UUID;

import com.aps.vitalpair.pair.domain.model.PairStatus;
import com.aps.vitalpair.pair.domain.model.RelationshipType;

/** The aggregate view of the pair, members resolved, used by the use cases. */
public record PairView(
        UUID id,
        String pairName,
        PairStatus status,
        RelationshipType relationshipType,
        String inviteCode,
        List<MemberView> members) {}
