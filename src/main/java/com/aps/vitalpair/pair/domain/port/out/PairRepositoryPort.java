package com.aps.vitalpair.pair.domain.port.out;

import java.util.Optional;
import java.util.UUID;

import com.aps.vitalpair.pair.domain.model.Pair;

/** Outbound port for persisting pairs (tenants). */
public interface PairRepositoryPort {

    Pair save(Pair pair);

    /**
     * Saves and sends the statement to the database immediately.
     *
     * <p>Needed when a pair created in this transaction is about to be referenced by SQL that
     * does not go through the persistence context, which is how {@code TenantDataMigrationPort}
     * reassigns rows. JPA would otherwise hold the insert until the transaction ends, and the
     * update would fail on a foreign key to a pair the database has not seen yet.
     */
    Pair saveAndFlush(Pair pair);

    Optional<Pair> findById(UUID id);

    Optional<Pair> findByInviteCode(String inviteCode);

    void deleteById(UUID id);
}
