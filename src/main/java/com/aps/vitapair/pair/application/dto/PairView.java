package com.aps.vitapair.pair.application.dto;

import com.aps.vitapair.pair.domain.model.PairStatus;
import java.util.List;
import java.util.UUID;

/** Visão agregada do par (membros resolvidos), usada pelos casos de uso. */
public record PairView(
        UUID id,
        String pairName,
        PairStatus status,
        String inviteCode,
        List<MemberView> members) {
}
