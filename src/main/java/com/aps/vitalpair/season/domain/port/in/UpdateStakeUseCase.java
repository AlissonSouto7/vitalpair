package com.aps.vitalpair.season.domain.port.in;

import java.util.UUID;

import com.aps.vitalpair.season.application.dto.SeasonView;

/** Changes the stake of the user's active season and returns the updated view. */
public interface UpdateStakeUseCase {

    SeasonView updateStake(UUID userId, String stake);
}
