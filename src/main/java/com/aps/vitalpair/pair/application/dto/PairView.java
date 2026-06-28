package com.aps.vitalpair.pair.application.dto;

import com.aps.vitalpair.pair.domain.model.PairStatus;
import com.aps.vitalpair.pair.domain.model.RelationshipType;
import java.util.List;
import java.util.UUID;

/** Visão agregada do par (membros resolvidos), usada pelos casos de uso. */
public record PairView(
        UUID id,
        String pairName,
        PairStatus status,
        RelationshipType relationshipType,
        String inviteCode,
        List<MemberView> members) {
}
