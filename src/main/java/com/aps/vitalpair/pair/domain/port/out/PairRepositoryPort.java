package com.aps.vitalpair.pair.domain.port.out;

import java.util.Optional;
import java.util.UUID;

import com.aps.vitalpair.pair.domain.model.Pair;

/** Porta de saída para persistência de pares (tenants). */
public interface PairRepositoryPort {

    Pair save(Pair pair);

    Optional<Pair> findById(UUID id);

    Optional<Pair> findByInviteCode(String inviteCode);

    void deleteById(UUID id);
}
