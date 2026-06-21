package com.aps.vitapair.gamification.domain.model;

import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

/** Conquista do catálogo. Imutável. */
@Getter
@Builder(toBuilder = true)
public class Badge {

    private final UUID id;
    private final String code;
    private final String name;
    private final String description;
    private final String icon;
    private final BadgeCategory category;
}
