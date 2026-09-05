package com.aps.vitalpair.season.domain.port.in;

import java.util.UUID;

import com.aps.vitalpair.season.application.dto.SeasonView;

/** Garante a temporada atual do usuário e devolve a visão completa para o frontend. */
public interface GetSeasonUseCase {

    SeasonView getCurrentSeason(UUID userId);
}
