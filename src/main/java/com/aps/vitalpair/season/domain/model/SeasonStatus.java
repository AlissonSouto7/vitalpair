package com.aps.vitalpair.season.domain.model;

/** Estado de uma temporada. Apenas uma {@code ACTIVE} por tenant. */
public enum SeasonStatus {
    ACTIVE,
    CLOSED
}
