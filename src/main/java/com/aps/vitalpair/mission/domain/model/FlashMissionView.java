package com.aps.vitalpair.mission.domain.model;

import java.time.Instant;
import java.time.LocalDate;

import lombok.Builder;
import lombok.Getter;

/**
 * A missão relâmpago de hoje, com o estado dela. Imutável.
 *
 * <p>{@code accepted} é do par: um aceita e liga para os dois, porque topar o desafio junto é
 * o ponto. {@code done} é de quem está perguntando: cada pessoa bebe a própria água, e cada
 * uma recebe a própria recompensa.
 */
@Getter
@Builder(toBuilder = true)
public class FlashMissionView {

    private final Mission mission;
    private final LocalDate date;
    private final boolean accepted;

    /** Se quem perguntou já marcou esta missão como cumprida hoje, e portanto já recebeu. */
    private final boolean done;

    private final Instant expiresAt;
}
