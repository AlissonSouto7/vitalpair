package com.aps.vitalpair.mission.domain.model;

import lombok.Builder;
import lombok.Getter;

/**
 * Progresso calculado de uma missão semanal para o usuário logado (e seu parceiro,
 * quando a missão é de dupla). Combina o item do catálogo com as contagens reais.
 */
@Getter
@Builder
public class WeeklyMissionProgress {

    private final WeeklyMission mission;
    /** Progresso do usuário logado na métrica da missão. */
    private final int current;
    /** Primeiro nome do parceiro, ou {@code null} se a missão é SELF ou não há parceiro. */
    private final String partnerName;
    /** Progresso do parceiro, ou {@code null} se a missão é SELF ou não há parceiro. */
    private final Integer partnerCurrent;
    /** Se a missão foi concluída segundo as regras do seu escopo. */
    private final boolean completed;
}
