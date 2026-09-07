package com.aps.vitalpair.season.domain.port.in;

import java.util.UUID;

import com.aps.vitalpair.season.application.dto.SeasonView;

/** Guarantees the user's current season and returns the whole view for the frontend. */
public interface GetSeasonUseCase {

    SeasonView getCurrentSeason(UUID userId);
}
