package com.aps.vitalpair.mission.infrastructure.web;

import java.time.Instant;

import com.aps.vitalpair.mission.domain.model.FlashMissionView;

/**
 * A missão relâmpago de hoje.
 *
 * @param accepted do par: um topar liga para os dois
 * @param done de quem perguntou, e só depois disto a recompensa é paga. Cada pessoa cumpre a
 *     sua, então o parceiro ter feito não marca esta como feita
 */
public record FlashMissionResponse(
        String code, String title, String description, int reward, Instant expiresAt, boolean accepted, boolean done) {

    public static FlashMissionResponse from(FlashMissionView view) {
        return new FlashMissionResponse(
                view.getMission().getCode(),
                view.getMission().getTitle(),
                view.getMission().getDescription(),
                view.getMission().getRewardPoints(),
                view.getExpiresAt(),
                view.isAccepted(),
                view.isDone());
    }
}
