package com.aps.vitalpair.pair.domain.port.out;

import java.util.UUID;

/**
 * Moves everything one person recorded from one tenant to another.
 *
 * <p>Joining a pair is the only operation in the product that changes a user's tenant, and
 * the rows they wrote before it still point at the tenant they are leaving. Two things go
 * wrong without this: the abandoned pair cannot be deleted, because twelve foreign keys
 * point at pairs and every one of them is NO ACTION; and the rows that carry tenant_id
 * without such a key, notifications among them, would survive as data no query can reach,
 * since every query is scoped by the caller's tenant.
 */
public interface TenantDataMigrationPort {

    /**
     * Reassigns the rows owned by one user from one tenant to another.
     *
     * @return how many rows were moved, for the log line that records what happened
     */
    int moveUserData(UUID userId, UUID fromTenantId, UUID toTenantId);

    /**
     * Discards what belonged to the abandoned tenant rather than to any one person.
     *
     * <p>Weekly scores, missions and seasons describe a competition between two people. The
     * pending pair being left had one, so its scores are one person's solo total sitting in
     * the {@code user1_score} column. Carrying that into the new pair would credit it to
     * whichever slot the joiner happens to occupy there, which is a number nobody earned in
     * that competition. Deleting is the honest answer, and it is what lets the abandoned
     * pair be removed at all.
     *
     * @return how many rows were discarded
     */
    int discardTenantOwnedData(UUID tenantId);
}
