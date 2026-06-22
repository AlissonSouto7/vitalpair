package com.aps.vitapair.pair.infrastructure.web;

import com.aps.vitapair.pair.application.dto.PairView;
import com.aps.vitapair.pair.domain.model.PairStatus;
import com.aps.vitapair.pair.domain.model.RelationshipType;
import java.util.List;
import java.util.UUID;

public record PairResponse(
        UUID id,
        String pairName,
        PairStatus status,
        RelationshipType relationshipType,
        String inviteCode,
        List<PairMemberResponse> members) {

    public static PairResponse from(PairView view) {
        return new PairResponse(
                view.id(),
                view.pairName(),
                view.status(),
                view.relationshipType(),
                view.inviteCode(),
                view.members().stream().map(PairMemberResponse::from).toList())
        ;
    }
}
