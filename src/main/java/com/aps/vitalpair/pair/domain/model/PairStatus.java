package com.aps.vitalpair.pair.domain.model;

public enum PairStatus {
    /** Par criado, aguardando o segundo membro aceitar o convite. */
    PENDING,
    /** Os dois membros estão ativos. */
    ACTIVE,
    /** Parceria temporariamente pausada. */
    PAUSED
}
