package com.aps.vitapair.pair.infrastructure.web;

import com.aps.vitapair.pair.application.dto.MemberView;
import java.util.UUID;

public record PairMemberResponse(UUID userId, String name, String email, String avatarUrl) {

    public static PairMemberResponse from(MemberView member) {
        return new PairMemberResponse(member.userId(), member.name(), member.email(), member.avatarUrl());
    }
}
