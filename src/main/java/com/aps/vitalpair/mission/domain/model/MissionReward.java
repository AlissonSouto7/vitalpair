package com.aps.vitalpair.mission.domain.model;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import lombok.Builder;
import lombok.Getter;

/**
 * Uma recompensa de missão já paga.
 *
 * <p>Existe para poder responder "já paguei esta?" antes de pagar de novo. O progresso das
 * missões semanais é recalculado a cada leitura da tela, então sem esta memória abrir a tela
 * dez vezes pagaria dez vezes.
 *
 * <p>É da pessoa, não do par: duas pessoas da mesma dupla completam a mesma missão em dias
 * diferentes e cada uma recebe a sua. O aceite, esse sim, é do par, e mora em outro lugar.
 */
@Getter
@Builder
public class MissionReward {

    private final UUID id;
    private final UUID tenantId;
    private final UUID userId;

    /** O código da missão no catálogo, de qualquer um dos dois tipos. */
    private final String missionCode;

    /**
     * O período a que esta recompensa se refere.
     *
     * <p>A segunda-feira da semana, para a missão semanal; o próprio dia, para a relâmpago. É
     * o que separa "cumpri de novo na semana seguinte" de "abri a tela duas vezes".
     */
    private final LocalDate periodStart;

    private final int points;
    private final Instant awardedAt;
}
