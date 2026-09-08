package com.aps.vitalpair.pair.domain.model;

public enum PairStatus {
    /** Par criado, aguardando o segundo membro aceitar o convite. */
    PENDING,
    /** Both members are in. */
    ACTIVE,
    /** Parceria temporariamente pausada. */
    PAUSED,
    /**
     * The two people are no longer partners, and the pair is nobody's tenant.
     *
     * <p>The row survives because its seasons, weekly scores and point ledger hang off it,
     * and those describe a competition that happened. Both members moved to tenants of their
     * own, so no query reaches this one any more.
     */
    ENDED
}
