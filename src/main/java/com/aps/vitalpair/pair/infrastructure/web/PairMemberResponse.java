package com.aps.vitalpair.pair.infrastructure.web;

import java.util.UUID;

import com.aps.vitalpair.pair.application.dto.MemberView;

public record PairMemberResponse(UUID userId, String name, String email, String avatarUrl) {

    public static PairMemberResponse from(MemberView member) {
        return new PairMemberResponse(member.userId(), member.name(), member.email(), member.avatarUrl());
    }
}
