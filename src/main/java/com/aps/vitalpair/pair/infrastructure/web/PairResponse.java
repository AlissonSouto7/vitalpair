package com.aps.vitalpair.pair.infrastructure.web;

import java.util.List;
import java.util.UUID;

import com.aps.vitalpair.pair.application.dto.PairView;
import com.aps.vitalpair.pair.domain.model.PairStatus;
import com.aps.vitalpair.pair.domain.model.RelationshipType;

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
                view.members().stream().map(PairMemberResponse::from).toList());
    }
}
