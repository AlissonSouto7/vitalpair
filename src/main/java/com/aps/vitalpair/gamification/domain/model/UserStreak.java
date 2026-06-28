package com.aps.vitalpair.gamification.domain.model;

import java.time.LocalDate;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

/** Sequência diária de um usuário para um tipo de atividade. Imutável. */
@Getter
@Builder(toBuilder = true)
public class UserStreak {

    private final UUID id;
    private final UUID tenantId;
    private final UUID userId;
    private final StreakType type;
    private final int currentCount;
    private final int longestCount;
    private final LocalDate lastActivityDate;
}
