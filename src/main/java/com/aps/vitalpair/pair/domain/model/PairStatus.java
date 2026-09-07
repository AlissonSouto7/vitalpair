package com.aps.vitalpair.pair.domain.model;

public enum PairStatus {
    /** Par criado, aguardando o segundo membro aceitar o convite. */
    PENDING,
    /** Both members are in. */
    ACTIVE,
    /** Parceria temporariamente pausada. */
    PAUSED
}
