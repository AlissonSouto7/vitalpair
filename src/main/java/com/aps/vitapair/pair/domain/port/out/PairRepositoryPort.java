package com.aps.vitapair.pair.domain.port.out;

import com.aps.vitapair.pair.domain.model.Pair;
import java.util.Optional;
import java.util.UUID;

/** Porta de saída para persistência de pares (tenants). */
public interface PairRepositoryPort {

    Pair save(Pair pair);

    Optional<Pair> findById(UUID id);

    Optional<Pair> findByInviteCode(String inviteCode);
}
