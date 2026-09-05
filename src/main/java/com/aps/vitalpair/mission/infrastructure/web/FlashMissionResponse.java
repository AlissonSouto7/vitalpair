package com.aps.vitalpair.mission.infrastructure.web;

import java.time.Instant;

import com.aps.vitalpair.mission.domain.model.FlashMissionView;

public record FlashMissionResponse(
        String code, String title, String description, int reward, Instant expiresAt, boolean accepted) {

    public static FlashMissionResponse from(FlashMissionView view) {
        return new FlashMissionResponse(
                view.getMission().getCode(),
                view.getMission().getTitle(),
                view.getMission().getDescription(),
                view.getMission().getRewardPoints(),
                view.getExpiresAt(),
                view.isAccepted());
    }
}
